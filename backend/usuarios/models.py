from django.db import models

# Create your models here.
class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'rol'
        
class Area(models.Model):
    id_area = models.AutoField(primary_key=True)
    nombre_area = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'area'

class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nombre_usuario = models.CharField(max_length=50)
    id_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='id_rol')
    id_area = models.ForeignKey(Area, models.DO_NOTHING, db_column='id_area')
    email_usuario = models.CharField(unique=True, max_length=100)
    password = models.CharField(max_length=60)
    activo = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'usuario'
        
