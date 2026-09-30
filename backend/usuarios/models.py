from django.db import models

# Create your models here.
class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'rol'
    
    def __str__(self):
        return f'ID: {self.id_rol}\n Rol: {self.nombre_rol}'
        
class Area(models.Model):
    id_area = models.AutoField(primary_key=True)
    nombre_area = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'area'
    
    def __str__(self):
        return f'ID: {self.id_area}\n Area: {self.nombre_area}'

class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nombre_usuario = models.CharField(max_length=50)
    id_rol = models.ForeignKey(Rol, models.PROTECT, db_column='id_rol')
    id_area = models.ForeignKey(Area, models.PROTECT, db_column='id_area')
    email_usuario = models.EmailField(unique=True, max_length=100)
    password = models.CharField(max_length=128)
    activo = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'usuario'
    
    def __str__(self):
        return f'ID: {self.id_usuario}\n Nombre: {self.nombre_usuario}\n ID Rol: {self.id_rol}\n ID Area: {self.id_area}'
