from rest_framework import serializers
from inventario.models import Recurso, Proveedor, UnidadRecurso, FONDOS, ESTADOS_RECURSO
from usuarios.models import Usuario
from .models import Motivo, Alerta
from .constantes import nombres_motivos, separar_observacion, TIPOS_NOVEDAD

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
    
class AlertaSerializer(serializers.ModelSerializer):
    # Solo lectura: datos de la unidad y el texto separado en tipo + descripción
    codigo_interno = serializers.CharField(source='id_unidad_recurso.codigo_interno', read_only=True)
    nombre_recurso = serializers.CharField(
        source='id_unidad_recurso.id_recurso.nombre_recurso', read_only=True
    )
    tipo = serializers.SerializerMethodField()
    descripcion = serializers.SerializerMethodField()
    nombre_usuario_reporta = serializers.SerializerMethodField()
    nombre_usuario_gestiona = serializers.SerializerMethodField()

    class Meta:
        model = Alerta
        fields = [
            'id_alerta', 'id_unidad_recurso', 'codigo_interno', 'nombre_recurso',
            'origen', 'tipo', 'descripcion', 'estado_alerta', 'fecha_generada',
            'id_usuario_reporta', 'nombre_usuario_reporta',
            'id_usuario_gestiona', 'nombre_usuario_gestiona', 'fecha_gestionada',
        ]

    def get_tipo(self, obj):
        return separar_observacion(obj.observaciones)[0]

    def get_descripcion(self, obj):
        return separar_observacion(obj.observaciones)[1]
    
    def get_nombre_usuario_reporta(self, obj):
        # Las alertas automáticas no tienen quien reporta
        return obj.id_usuario_reporta.nombre_usuario if obj.id_usuario_reporta else None

    def get_nombre_usuario_gestiona(self, obj):
        return obj.id_usuario_gestiona.nombre_usuario if obj.id_usuario_gestiona else None

class GestionAlertaSerializer(serializers.Serializer):
    estado_alerta = serializers.ChoiceField(choices=['Pendiente', 'Atendida'])
    # Temporal: con el login saldrá de la sesión y no del body
    id_usuario_gestiona = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(activo=True)
    )
    resolucion = serializers.CharField(max_length=300, required=False, allow_blank=True, allow_null=True)
    

class NovedadSerializer(serializers.Serializer):
    id_unidad_recurso = serializers.PrimaryKeyRelatedField(queryset=UnidadRecurso.objects.all())
    # Temporal: con el login saldrá de la sesión y no del body
    id_usuario_reporta = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(activo=True)
    )
    tipo = serializers.ChoiceField(choices=TIPOS_NOVEDAD)
    descripcion = serializers.CharField(min_length=10, max_length=500)
    