from django.db import transaction
from .models import Rol, Area, Usuario

ROL_ADMIN = 'administrador'
AREA_INICIAL = 'Jefatura'

class SetupYaRealizado(Exception):
    """Ya existe al menos un usuario: el registro inicial está cerrado."""

def requiere_setup():
    return not Usuario.objects.exists()

@transaction.atomic
def crear_primer_administrador(serializer):
    # Se bloquea la tabla de roles para serializar intentos simultáneos
    Rol.objects.select_for_update().all().count()

    if Usuario.objects.exists():
        raise SetupYaRealizado()

    rol, _ = Rol.objects.get_or_create(nombre_rol=ROL_ADMIN)
    area, _ = Area.objects.get_or_create(nombre_area=AREA_INICIAL)

    return serializer.save(id_rol=rol, id_area=area)