from rest_framework import serializers
from .models import Proveedor


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
    