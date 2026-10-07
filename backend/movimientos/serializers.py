from rest_framework import serializers
from inventario.models import Recurso, Proveedor, FONDOS, ESTADOS_RECURSO
from usuarios.models import Usuario
from .models import Motivo


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
    