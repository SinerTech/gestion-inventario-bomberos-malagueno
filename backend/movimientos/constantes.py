# Motivos válidos por tipo de movimiento.
# Los nombres deben coincidir exactamente con la tabla motivo.
# DEUDA TÉCNICA: cuando se pueda modificar la BD, reemplazar esto por una
# FK motivo -> tipo_movimiento.
MOTIVOS_POR_TIPO = {
    'ingreso': ['Compra', 'Donación', 'Subsidio'],
    'retiro': ['Emergencia', 'Capacitación', 'Guardia'],
}

# Tipos de novedad. Se guardan como prefijo en alerta.observaciones: "[Tipo] texto"
# DEUDA TÉCNICA: en un futuro, proximas versiones, la BD, pasar a una columna "tipo" en alerta.
TIPOS_NOVEDAD = ['Mantenimiento', 'Reposición', 'Actualización', 'Retiro de recurso']

# Ranking de estados, de mejor (0) a peor (5). Una alerta automática se genera
# cuando el estado al devolver tiene un número MAYOR que el estado al retirar.
RANKING_ESTADOS = {
    'Op-Bueno': 0,
    'Op-Regular': 1,
    'Op-Malo': 2,
    'NoOp-Bueno': 3,
    'NoOp-Regular': 4,
    'NoOp-Malo': 5,
}

def nombres_motivos(tipo):
    return MOTIVOS_POR_TIPO.get((tipo or '').lower(), [])

def componer_observacion(tipo, descripcion):
    return f"[{tipo}] {descripcion}"


def separar_observacion(observaciones):
    # Asegurar que sea string y limpiar espacios iniciales/finales opcionalmente
    texto = (observaciones or "").strip()

    # Verificar si cumple con el formato básico de empezar con '[' y tener un ']' después
    if texto.startswith("[") and "]" in texto:
        # Dividir en el primer ']' que se encuentre
        prefijo, resto = texto[1:].split("]", 1)
        return prefijo, resto.lstrip()  # lstrip() quita los espacios entre el ']' y el texto
    return "General", observaciones or ""

def estado_empeoro(estado_retiro, estado_devolucion):
    # Si falta alguno de los dos estados no se puede comparar
    if estado_retiro not in RANKING_ESTADOS or estado_devolucion not in RANKING_ESTADOS:
        return False
    return RANKING_ESTADOS[estado_devolucion] > RANKING_ESTADOS[estado_retiro]
