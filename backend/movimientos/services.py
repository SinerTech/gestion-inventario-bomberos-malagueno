from django.db import transaction
from django.utils import timezone
from inventario.models import Recurso, UnidadRecurso
from .models import MovimientoInventario, TipoMovimiento


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
