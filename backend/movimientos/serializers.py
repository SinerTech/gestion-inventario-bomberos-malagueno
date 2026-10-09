from rest_framework import serializers
from inventario.models import Recurso, Proveedor, UnidadRecurso, FONDOS, ESTADOS_RECURSO
from usuarios.models import Usuario
from .models import Motivo
from .constantes import nombres_motivos

class MotivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motivo
        fields = ['id_motivo', 'nombre_motivo']


class IngresoSerializer(serializers.Serializer):
    # Serializer "manual": no representa un modelo, sino el formulario de ingreso

    # Datos del ingreso
    id_recurso = serializers.PrimaryKeyRelatedField(queryset=Recurso.objects.all())
    cantidad = serializers.IntegerField(min_value=1, max_value=200)
    id_proveedor = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all())
    id_motivo = serializers.PrimaryKeyRelatedField(queryset=Motivo.objects.all())
    numero_lote_factura = serializers.CharField(max_length=100)
    # Temporal: cuando exista el login, saldrá de la sesión y no del body
    id_usuario_registra = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(activo=True)
    )

    # Datos que se copian a cada unidad
    medida = serializers.CharField(max_length=60, required=False, allow_blank=True, allow_null=True)
    marca = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    valor = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=0, required=False, allow_null=True
    )
    fondo = serializers.ChoiceField(choices=FONDOS, default='Propio')
    estado = serializers.ChoiceField(choices=ESTADOS_RECURSO, default='Op-Bueno')
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def validate_id_motivo(self, motivo):
        if motivo.nombre_motivo not in nombres_motivos('ingreso'):
            raise serializers.ValidationError("El motivo no corresponde a un ingreso.")
        return motivo

class ItemRetiroSerializer(serializers.Serializer):
    id_unidad_recurso = serializers.PrimaryKeyRelatedField(queryset=UnidadRecurso.objects.all())
    # Solo estados operativos: no se retira equipo no operativo
    estado_al_retirar = serializers.ChoiceField(
        choices=[e for e in ESTADOS_RECURSO if e[0].startswith('Op-')]
    )

class RetiroSerializer(serializers.Serializer):
    id_usuario_retira = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(activo=True)
    )
    # Temporal: con el login saldrá de la sesión y no del body
    id_usuario_registra = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(activo=True)
    )
    id_motivo = serializers.PrimaryKeyRelatedField(
        queryset=Motivo.objects.all(), required=False, allow_null=True
    )
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    unidades = ItemRetiroSerializer(many=True, allow_empty=False)

    def validate_unidades(self, items):
        ids = [i['id_unidad_recurso'].pk for i in items]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Hay unidades repetidas en el retiro.")
        if len(ids) > 50:
            raise serializers.ValidationError("Un retiro admite hasta 50 unidades.")
        return items
    
    def validate_id_motivo(self, motivo):
        if motivo and motivo.nombre_motivo not in nombres_motivos('retiro'):
            raise serializers.ValidationError("El motivo no corresponde a un retiro.")
        return motivo
    
class ItemDevolucionSerializer(serializers.Serializer):
    id_unidad_recurso = serializers.PrimaryKeyRelatedField(queryset=UnidadRecurso.objects.all())
    # Al devolver sí puede volver en mal estado: se aceptan los 6 valores
    estado_al_devolver = serializers.ChoiceField(choices=ESTADOS_RECURSO)


class DevolucionSerializer(serializers.Serializer):
    id_usuario_devuelve = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(activo=True)
    )
    # Temporal: con el login saldrá de la sesión y no del body
    id_usuario_registra = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(activo=True)
    )
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    unidades = ItemDevolucionSerializer(many=True, allow_empty=False)

    def validate_unidades(self, items):
        ids = [i['id_unidad_recurso'].pk for i in items]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Hay unidades repetidas en la devolución.")
        if len(ids) > 50:
            raise serializers.ValidationError("Una devolución admite hasta 50 unidades.")
        return items
    