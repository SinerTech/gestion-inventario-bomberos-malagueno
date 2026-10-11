from django.db import transaction
from django.utils import timezone
from inventario.models import Recurso, UnidadRecurso, AreaCategoria
from .models import MovimientoInventario, TipoMovimiento, Alerta
from .constantes import componer_observacion

def _generar_codigos(recurso, cantidad):
    # Formato: R0007-0001 (recurso 7, unidad 1). Continúa la numeración existente
    prefijo = f"R{recurso.id_recurso:04d}-"
    existentes = UnidadRecurso.objects.filter(
        codigo_interno__startswith=prefijo
    ).values_list('codigo_interno', flat=True)

    numeros = [
        int(codigo[len(prefijo):])
        for codigo in existentes
        if codigo[len(prefijo):].isdigit()
    ]
    ultimo = max(numeros, default=0)
    return [f"{prefijo}{ultimo + i:04d}" for i in range(1, cantidad + 1)]


@transaction.atomic
def registrar_ingreso(datos):
    # Bloquea la fila del recurso hasta terminar: si dos personas ingresan el
    # mismo recurso a la vez, esperan su turno y no se repiten códigos
    recurso = Recurso.objects.select_for_update().get(pk=datos['id_recurso'].pk)
    tipo_ingreso = TipoMovimiento.objects.get(nombre_tipo_movimiento__iexact='Ingreso')
    usuario = datos['id_usuario_registra']
    ahora = timezone.now()

    codigos = _generar_codigos(recurso, datos['cantidad'])

    # 1) Las unidades (una fila por cada elemento físico)
    UnidadRecurso.objects.bulk_create([
        UnidadRecurso(
            codigo_interno=codigo,
            id_recurso=recurso,
            medida=datos.get('medida') or None,
            marca=datos.get('marca') or None,
            numero_serie_fabricante=None,
            fecha_alta=ahora,
            valor=datos.get('valor'),
            fondo=datos['fondo'],
            id_proveedor=datos['id_proveedor'],
            estado=datos['estado'],
            disponibilidad='Disponible',
            id_usuario_asignado=None,
            observaciones=datos.get('observaciones') or None,
        )
        for codigo in codigos
    ])

    # MySQL no devuelve los ids en bulk_create, así que se vuelven a leer
    unidades = list(
        UnidadRecurso.objects.filter(codigo_interno__in=codigos).order_by('codigo_interno')
    )

    # 2) Un movimiento de ingreso por cada unidad (trazabilidad)
    MovimientoInventario.objects.bulk_create([
        MovimientoInventario(
            id_recurso=recurso,
            id_unidad_recurso=unidad,
            id_usuario_asignado=usuario,
            id_usuario_registra=usuario,
            id_proveedor=datos['id_proveedor'],
            id_motivo=datos['id_motivo'],
            id_tipo_movimiento=tipo_ingreso,
            fecha_hora_movimiento=ahora,
            numero_lote_factura=datos['numero_lote_factura'],
            observaciones=datos.get('observaciones') or None,
        )
        for unidad in unidades
    ])

    return unidades

class RetiroInvalido(Exception):
    """El retiro no se puede hacer por el estado actual de las unidades."""


@transaction.atomic
def registrar_retiro(datos):
    tipo_retiro = TipoMovimiento.objects.get(nombre_tipo_movimiento__iexact='Retiro')
    retira = datos['id_usuario_retira']
    registra = datos['id_usuario_registra']
    items = datos['unidades']
    ahora = timezone.now()
        
    # Se bloquean las filas de las unidades hasta terminar. Si dos supervisores
    # intentan retirar la misma unidad a la vez, el segundo espera y ve el cambio
    ids = [item['id_unidad_recurso'].pk for item in items]
    unidades = {
        u.pk: u
        for u in UnidadRecurso.objects.select_for_update().filter(pk__in=ids).order_by('pk')
    }
    
    if not retira.activo or retira.id_rol.nombre_rol != 'bombero':
        raise RetiroInvalido(
            'Solo los bomberos activos pueden retirar unidades.'
        )

    movimientos = []
    for item in items:
        unidad = unidades[item['id_unidad_recurso'].pk]

        if unidad.disponibilidad != 'Disponible':
            raise RetiroInvalido(
                f"La unidad {unidad.codigo_interno} no está disponible "
                f"(estado actual: {unidad.disponibilidad})."
            )
        if unidad.estado.startswith('NoOp'):
            raise RetiroInvalido(
                f"La unidad {unidad.codigo_interno} no es operativa y no puede retirarse."
            )
            
        categoria_id = unidad.id_recurso.id_categoria_id
        categoria_habilitada = AreaCategoria.objects.filter(
            id_area_id=retira.id_area_id,
            id_categoria_id=categoria_id,
        ).exists()
    
        if not categoria_habilitada:
            raise RetiroInvalido(
                f"La unidad {unidad.codigo_interno} pertenece a una "
                f"categoría no habilitada para el área de "
                f"{retira.nombre_usuario}."
            )    

        estado = item['estado_al_retirar']

        # Se modifica el objeto en memoria; se guarda todo junto más abajo
        unidad.disponibilidad = 'En Uso'
        unidad.id_usuario_asignado = retira
        unidad.estado = estado

        movimientos.append(MovimientoInventario(
            id_recurso=unidad.id_recurso,
            id_unidad_recurso=unidad,
            id_usuario_asignado=retira,
            id_usuario_registra=registra,
            id_proveedor=None,
            id_motivo=datos.get('id_motivo'),
            id_tipo_movimiento=tipo_retiro,
            estado_al_retirar=estado,
            fecha_hora_movimiento=ahora,
            observaciones=datos.get('observaciones') or None,
        ))

    UnidadRecurso.objects.bulk_update(
        list(unidades.values()), ['disponibilidad', 'id_usuario_asignado', 'estado']
    )
    MovimientoInventario.objects.bulk_create(movimientos)

    return list(unidades.values())

class DevolucionInvalida(Exception):
    """La devolución no se puede hacer por el estado actual de las unidades."""


@transaction.atomic
def registrar_devolucion(datos):
    devuelve = datos['id_usuario_devuelve']
    
    if not devuelve.activo or devuelve.id_rol.nombre_rol != 'bombero':
        raise DevolucionInvalida(
            'Solo los bomberos activos pueden devolver unidades.'
        )
        
    items = datos['unidades']
    ahora = timezone.now()
    observaciones = datos.get('observaciones')

    # Se bloquean las unidades hasta terminar (como en retiro)
    ids = [item['id_unidad_recurso'].pk for item in items]
    unidades = {
        u.pk: u
        for u in UnidadRecurso.objects.select_for_update().filter(pk__in=ids).order_by('pk')
    }

    # Movimientos de retiro abiertos (sin devolución) de esas unidades
    abiertos = {
        m.id_unidad_recurso_id: m
        for m in MovimientoInventario.objects.select_for_update().filter(
            id_unidad_recurso__in=ids,
            id_tipo_movimiento__nombre_tipo_movimiento__iexact='Retiro',
            fecha_hora_devolucion__isnull=True,
        )
    }

    movimientos = []
    for item in items:
        unidad = unidades[item['id_unidad_recurso'].pk]

        if unidad.disponibilidad != 'En Uso':
            raise DevolucionInvalida(
                f"La unidad {unidad.codigo_interno} no está en uso "
                f"(estado actual: {unidad.disponibilidad})."
            )
        if unidad.id_usuario_asignado_id != devuelve.pk:
            raise DevolucionInvalida(
                f"La unidad {unidad.codigo_interno} no está asignada a {devuelve.nombre_usuario}."
            )

        movimiento = abiertos.get(unidad.pk)
        if movimiento is None:
            raise DevolucionInvalida(
                f"No se encontró el retiro pendiente de la unidad {unidad.codigo_interno}."
            )

        estado = item['estado_al_devolver']

        # Cierre del movimiento de retiro
        movimiento.estado_al_devolver = estado
        movimiento.fecha_hora_devolucion = ahora
        if observaciones:
            previas = movimiento.observaciones
            movimiento.observaciones = (
                f"{previas}\nDevolución: {observaciones}" if previas else f"Devolución: {observaciones}"
            )
        movimientos.append(movimiento)

        # La unidad vuelve a estar libre
        unidad.disponibilidad = 'Disponible'
        unidad.id_usuario_asignado = None
        unidad.estado = estado

    UnidadRecurso.objects.bulk_update(
        list(unidades.values()), ['disponibilidad', 'id_usuario_asignado', 'estado']
    )
    MovimientoInventario.objects.bulk_update(
        movimientos, ['estado_al_devolver', 'fecha_hora_devolucion', 'observaciones']
    )

    return list(unidades.values())

class NovedadInvalida(Exception):
    """La novedad no se puede registrar por el estado actual de la unidad."""


@transaction.atomic
def registrar_novedad(datos):
    usuario = datos['id_usuario_reporta']
    tipo = datos['tipo']

    # El candado serializa reportes simultáneos sobre la misma unidad
    unidad = UnidadRecurso.objects.select_for_update().get(pk=datos['id_unidad_recurso'].pk)

    if unidad.id_usuario_asignado_id != usuario.pk:
        raise NovedadInvalida(
            f"La unidad {unidad.codigo_interno} no está asignada a {usuario.nombre_usuario}."
        )

    repetida = Alerta.objects.filter(
        id_unidad_recurso=unidad,
        id_usuario_reporta=usuario,
        estado_alerta='Pendiente',
        observaciones__startswith=f"[{tipo}]",
    ).exists()
    if repetida:
        raise NovedadInvalida(
            f"Ya tenés una novedad de tipo '{tipo}' pendiente para la unidad {unidad.codigo_interno}."
        )

    # Retiro vigente de esa unidad (el que todavía no tiene devolución)
    retiro_abierto = (
        MovimientoInventario.objects
        .filter(
            id_unidad_recurso=unidad,
            id_tipo_movimiento__nombre_tipo_movimiento__iexact='Retiro',
            fecha_hora_devolucion__isnull=True,
        )
        .order_by('-fecha_hora_movimiento')
        .first()
    )

    return Alerta.objects.create(
        id_unidad_recurso=unidad,
        origen='Manual',
        id_movimiento=retiro_abierto,      # puede ser None si no se encuentra
        id_usuario_reporta=usuario,
        fecha_generada=timezone.now(),
        observaciones=componer_observacion(tipo, datos['descripcion']),
        estado_alerta='Pendiente',
    )
    