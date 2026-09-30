from django.db import models
from usuarios.models import Usuario, Area

# Constantes
ESTADOS_RECURSO = [
    ('Op-Bueno', 'Op-Bueno'),
    ('Op-Regular', 'Op-Regular'),
    ('Op-Malo', 'Op-Malo'),
    ('NoOp-Bueno', 'NoOp-Bueno'),
    ('NoOp-Regular', 'NoOp-Regular'),
    ('NoOp-Malo', 'NoOp-Malo'),
]

DISPONIBILIDADES = [
    ('Disponible', 'Disponible'),
    ('En Uso', 'En Uso'),
    ('De Baja', 'De Baja'),
]

FONDOS = [
    ('Propio', 'Propio'),
    ('Donado', 'Donado'),
    ('Subsidio Nacional', 'Subsidio Nacional'),
    ('Subsidio Provincial', 'Subsidio Provincial'),
    ('Subsidio Especifico PPMF', 'Subsidio Especifico PPMF'),
]

# Create your models here.
class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'categoria'
    
    def __str__(self):
        return f'Categoria: {self.nombre_categoria}'

class AreaCategoria(models.Model):
    id_area_categoria = models.AutoField(primary_key=True)
    id_area = models.ForeignKey(Area, models.PROTECT, db_column='id_area')
    id_categoria = models.ForeignKey('Categoria', models.PROTECT, db_column='id_categoria')

    class Meta:
        managed = True
        db_table = 'area_categoria'
        unique_together = (('id_area', 'id_categoria'),)
    
    def __str__(self):
        return f'ID Relación: {self.id_area_categoria}\n ID Area: {self.id_area}\n ID Categoria: {self.id_categoria}'

class Recurso(models.Model):
    id_recurso = models.AutoField(primary_key=True)
    nombre_recurso = models.CharField(max_length=60)
    id_categoria = models.ForeignKey(Categoria, models.PROTECT, db_column='id_categoria')

    class Meta:
        managed = True
        db_table = 'recurso'
    
    def __str__(self):
        return f'Recurso: {self.nombre_recurso}'

class TipoMaterial(models.Model):
    id_tipo_material = models.AutoField(primary_key=True)
    nombre_tipo_material = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'tipo_material'
    
    def __str__(self):
        return f'Material: {self.nombre_tipo_material}'

class RecursoTipoMaterial(models.Model):
    id_recurso_tipo_material = models.AutoField(primary_key=True)
    id_recurso = models.ForeignKey(Recurso, models.PROTECT, db_column='id_recurso')
    id_tipo_material = models.ForeignKey('TipoMaterial', models.PROTECT, db_column='id_tipo_material')

    class Meta:
        managed = True
        db_table = 'recurso_tipo_material'
        unique_together = (('id_recurso', 'id_tipo_material'),)
    
    def __str__(self):
        return f'ID Relación: {self.id_recurso_tipo_material}\n ID Recurso: {self.id_recurso}\n ID Tipo de Material: {self.id_tipo_material}'

class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    razon_social = models.CharField(max_length=100)
    cuit = models.CharField(db_column='CUIT', unique=True, max_length=20)  # Field name made lowercase.
    telefono_proveedor = models.CharField(max_length=20, blank=True, null=True)
    email_proveedor = models.EmailField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'proveedor'
    
    def __str__(self):
        return f'ID Proveedor: {self.id_proveedor}\n Razon Social: {self.razon_social}'

class UnidadRecurso(models.Model):
    id_unidad_recurso = models.AutoField(primary_key=True)
    codigo_interno = models.CharField(unique=True, max_length=100)
    id_recurso = models.ForeignKey(Recurso, models.PROTECT, db_column='id_recurso')
    medida = models.CharField(max_length=60, blank=True, null=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    numero_serie_fabricante = models.CharField(max_length=100, blank=True, null=True)
    fecha_alta = models.DateTimeField()
    valor = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    fondo = models.CharField(max_length=24, choices=FONDOS, default='Propio')
    id_proveedor = models.ForeignKey(Proveedor, models.PROTECT, db_column='id_proveedor')
    estado = models.CharField(max_length=12, choices=ESTADOS_RECURSO, default='Op-Bueno')
    disponibilidad = models.CharField(max_length=10, choices=DISPONIBILIDADES, default='Disponible')
    id_usuario_asignado = models.ForeignKey(Usuario, models.PROTECT, db_column='id_usuario_asignado', blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    
    class Meta:
        managed = True
        db_table = 'unidad_recurso'
    
    def __str__(self):
        return f'ID Unidad: {self.id_unidad_recurso}\n Codigo: {self.codigo_interno}\n '
    