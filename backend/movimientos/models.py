from django.db import models
from usuarios.models import Usuario
from inventario.models import Recurso, UnidadRecurso, Proveedor

# Constantes
ESTADOS_ALERTA = [
    ('Pendiente', 'Pendiente'),
    ('Atendida', 'Atendida'),
]

ORIGENES_ALERTA = [
    ('Manual', 'Manual'),
    ('Automatica', 'Automática'),
]

ESTADOS_RECURSO = [
    ('Op-Bueno', 'Op-Bueno'),
    ('Op-Regular', 'Op-Regular'),
    ('Op-Malo', 'Op-Malo'),
    ('NoOp-Bueno', 'NoOp-Bueno'),
    ('NoOp-Regular', 'NoOp-Regular'),
    ('NoOp-Malo', 'NoOp-Malo'),
]

# Create your models here.
class TipoMovimiento(models.Model):
    id_tipo_movimiento = models.AutoField(primary_key=True)
    nombre_tipo_movimiento = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'tipo_movimiento'
    
    def __str__(self):
        return f"{self.nombre_tipo_movimiento}"

class Motivo(models.Model):
    id_motivo = models.AutoField(primary_key=True)
    nombre_motivo = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'motivo'
    
    def __str__(self):
        return f"{self.nombre_motivo}"

class MovimientoInventario(models.Model):
    id_movimiento = models.AutoField(primary_key=True)
    id_recurso = models.ForeignKey(Recurso, models.PROTECT, db_column='id_recurso')
    id_unidad_recurso = models.ForeignKey(UnidadRecurso, models.PROTECT, db_column='id_unidad_recurso')
    id_usuario_asignado = models.ForeignKey(Usuario, models.PROTECT, db_column='id_usuario_asignado')
    id_usuario_registra = models.ForeignKey(Usuario, models.PROTECT, db_column='id_usuario_registra', related_name='movimientoinventario_id_usuario_registra_set')
    id_proveedor = models.ForeignKey(Proveedor, models.PROTECT, db_column='id_proveedor', blank=True, null=True)
    id_motivo = models.ForeignKey(Motivo, models.PROTECT, db_column='id_motivo', blank=True, null=True)
    id_tipo_movimiento = models.ForeignKey('TipoMovimiento', models.PROTECT, db_column='id_tipo_movimiento')
    estado_al_retirar = models.CharField(max_length=12, blank=True, null=True, choices=ESTADOS_RECURSO)
    estado_al_devolver = models.CharField(max_length=12, blank=True, null=True, choices=ESTADOS_RECURSO)
    fecha_hora_movimiento = models.DateTimeField()
    fecha_hora_devolucion = models.DateTimeField(blank=True, null=True)
    numero_lote_factura = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'movimiento_inventario'
    
    def __str__(self):
        fecha_str = self.fecha_hora_movimiento.strftime('%d/%m/%Y %H:%M') if self.fecha_hora_movimiento else "Sin fecha"
        return f"[{self.id_tipo_movimiento}] Recurso: {self.id_recurso} - {fecha_str}"

class Alerta(models.Model):
    id_alerta = models.AutoField(primary_key=True)
    id_unidad_recurso = models.ForeignKey(UnidadRecurso, models.PROTECT, db_column='id_unidad_recurso')
    origen = models.CharField(max_length=10, choices=ORIGENES_ALERTA)
    id_movimiento = models.ForeignKey('MovimientoInventario', models.PROTECT, db_column='id_movimiento', blank=True, null=True)
    id_usuario_reporta = models.ForeignKey(Usuario, models.PROTECT, db_column='id_usuario_reporta', blank=True, null=True)
    fecha_generada = models.DateTimeField()
    observaciones = models.TextField(blank=True, null=True)
    estado_alerta = models.CharField(max_length=9, choices=ESTADOS_ALERTA, default='Pendiente')
    id_usuario_gestiona = models.ForeignKey(Usuario, models.PROTECT, db_column='id_usuario_gestiona', related_name='alerta_id_usuario_gestiona_set', blank=True, null=True)
    fecha_gestionada = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'alerta'

    def __str__(self):
        return f"Alerta {self.id_alerta} [{self.estado_alerta}] - Recurso: {self.id_unidad_recurso} ({self.origen})"
    