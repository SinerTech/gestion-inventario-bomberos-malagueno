# Motivos válidos por tipo de movimiento.
# Los nombres deben coincidir exactamente con la tabla motivo.
# DEUDA TÉCNICA: cuando se pueda modificar la BD, reemplazar esto por una
# FK motivo -> tipo_movimiento.
MOTIVOS_POR_TIPO = {
    'ingreso': ['Compra', 'Donación', 'Subsidio'],
    'retiro': ['Emergencia', 'Capacitación', 'Guardia'],
}


def nombres_motivos(tipo):
    return MOTIVOS_POR_TIPO.get((tipo or '').lower(), [])
