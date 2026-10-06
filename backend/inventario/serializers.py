from rest_framework import serializers
from .models import (
    Proveedor, Categoria, TipoMaterial, Recurso, RecursoTipoMaterial,
)
from django.db import transaction

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            'id_proveedor', 'razon_social', 'cuit',
            'telefono_proveedor', 'email_proveedor',
        ]
        read_only_fields = ['id_proveedor']

    def validate_cuit(self, value):
        # 1. Limpiar el texto y extraer solo los dígitos
        valor_limpio = value.strip()
        digitos = "".join(caracter for caracter in valor_limpio if caracter.isdigit())
        # 2. Validar el total de dígitos (deben ser exactamente 11)
        if len(digitos) != 11:
            raise serializers.ValidationError(
                "El CUIT debe tener exactamente 11 dígitos numéricos."
            )
        # 3. Validar la estructura del formato original ingresado
        # Si tenía guiones, deben estar en las posiciones correctas
        if "-" in valor_limpio and (valor_limpio[2] != "-" or valor_limpio[-2] != "-"):
            raise serializers.ValidationError(
                "El CUIT debe tener el formato XX-XXXXXXXX-X o ser solo números."
            )
        # 4. Formatear el CUIT normalizado con guiones
        cuit = f"{digitos[:2]}-{digitos[2:10]}-{digitos[10]}"
        # 5. Control de unicidad en la base de datos
        existe = Proveedor.objects.filter(cuit=cuit)
        if self.instance:  # Al editar, ignora al propio proveedor
            existe = existe.exclude(pk=self.instance.pk)
        if existe.exists():
            raise serializers.ValidationError("Ya existe un proveedor con ese CUIT.")
        return cuit

    def validate_telefono_proveedor(self, value):
        if value:
            # 1. Validar la longitud (6 a 20 caracteres)
            if not (6 <= len(value) <= 20):
                raise serializers.ValidationError(
                    "El teléfono debe tener entre 6 y 20 caracteres."
                )
            # 2. Validar caracteres permitidos sin Regex usando un conjunto (set)
            caracteres_permitidos = set("0123456789+- ()")
            if not set(value).issubset(caracteres_permitidos):
                raise serializers.ValidationError(
                    "El teléfono solo puede tener números, espacios, +, - y paréntesis."
                )
        return value

    def validate_email_proveedor(self, value):
        return value.lower() if value else value
    
class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nombre_categoria']


class TipoMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMaterial
        fields = ['id_tipo_material', 'nombre_tipo_material']

class RecursoSerializer(serializers.ModelSerializer):
    # Solo lectura
    categoria = CategoriaSerializer(source='id_categoria', read_only=True)
    # Django busca un metodo que tenga el mismo nombre pero comience por get_
    tipos_material = serializers.SerializerMethodField()

    # Solo escritura: lista de ids que llegan al registrar, ej. [1, 3]
    ids_tipo_material = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Recurso
        fields = [
            'id_recurso', 'nombre_recurso', 'id_categoria',
            'categoria', 'tipos_material', 'ids_tipo_material',
        ]
        read_only_fields = ['id_recurso']

    def get_tipos_material(self, obj):
        return [
            {
                'id_tipo_material': rel.id_tipo_material.id_tipo_material,
                'nombre_tipo_material': rel.id_tipo_material.nombre_tipo_material,
            }
            for rel in obj.recursotipomaterial_set.all()
        ]

    def validate_nombre_recurso(self, value):
        if not any(caracter.isalpha() for caracter in value):
            raise serializers.ValidationError("El nombre debe contener al menos una letra.")
        return value

    def validate_ids_tipo_material(self, value):
        # Se quitan repetidos ej. [1, 3, 1, 5]
        ids = list(dict.fromkeys(value))
        
        existentes = TipoMaterial.objects.filter(pk__in=ids).count()
        if existentes != len(ids):
            raise serializers.ValidationError("Alguno de los tipos de material no existe.")
        return ids

    def validate(self, attrs):
        # Mismo nombre dentro de la misma categoría = duplicado. Si desde el Cliente no se envian estos datos Django busca en la bd.
        nombre = attrs.get('nombre_recurso', getattr(self.instance, 'nombre_recurso', None))
        categoria = attrs.get('id_categoria', getattr(self.instance, 'id_categoria', None))

        if nombre and categoria:
            duplicado = Recurso.objects.filter(
                id_categoria=categoria, nombre_recurso__iexact=nombre
            )
            if self.instance:
                duplicado = duplicado.exclude(pk=self.instance.pk)
            if duplicado.exists():
                raise serializers.ValidationError({
                    'nombre_recurso': "Ya existe un recurso con ese nombre en la categoría."
                })
        return attrs

    def create(self, validated_data):
        ids_tipos = validated_data.pop('ids_tipo_material', [])
        # atomic: si falla algún insert de en la tabla intermedia, se deshace también el recurso, y no queda un recurso a medias
        with transaction.atomic():
            recurso = Recurso.objects.create(**validated_data)
            RecursoTipoMaterial.objects.bulk_create([
                RecursoTipoMaterial(id_recurso=recurso, id_tipo_material_id=id_tipo)
                for id_tipo in ids_tipos
            ])
        return recurso
    
    def update(self, instance, validated_data):
        # En un PUT, si el cliente no manda ids_tipo_material, se interpreta como "ninguno"
        ids_tipos = validated_data.pop('ids_tipo_material', [])
        with transaction.atomic():
            # super().update asigna nombre_recurso e id_categoria y hace save()
            instance = super().update(instance, validated_data)
            # Reemplazo de la tabla intermedia: se borran las filas viejas y se crean las nuevas
            RecursoTipoMaterial.objects.filter(id_recurso=instance).delete()
            RecursoTipoMaterial.objects.bulk_create([
                RecursoTipoMaterial(id_recurso=instance, id_tipo_material_id=id_tipo)
                for id_tipo in ids_tipos
            ])
        return instance
    