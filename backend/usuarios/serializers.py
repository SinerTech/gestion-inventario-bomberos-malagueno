from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import Usuario, Area, Rol

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre_rol']

class AreaSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Area
        fields = ['id_area', 'nombre_area']

class UsuarioSerializer(serializers.ModelSerializer):
    rol = RolSerializer(source='id_rol', read_only=True)
    area = AreaSerializer(source='id_area', read_only=True)
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'nombre_usuario', 'email_usuario', 'password', 'id_rol', 'id_area', 'rol', 'area', 'activo',]
        read_only_fields = ['id_usuario']
        extra_kwargs = {'password': {'write_only': True, 'required': False},}
    
    def validate(self, attrs):
        # Al crear (sin instancia en la bd) la contraseña es obligatoria
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'La contraseña es obligatoria.'})
        return attrs
    
    def validate_email_usuario(self, value):
        return value.lower()
    
    def validate_password(self, value):
        errores = []
        if len(value) < 8:
            errores.append("La contraseña debe incluir al menos 8 caracteres.")
        if not any(c.isupper() for c in value):
            errores.append("La contraseña debe incluir al menos una MAYUSCULA.")
        if not any(c.islower() for c in value):
            errores.append("La contraseña debe incluir al menos una minuscula.")
        if not any(c.isdigit() for c in value):
            errores.append("La constraseña debe incluir al menos un número.")
        if errores:
            raise serializers.ValidationError(errores)
        return value
    
    def create(self, validated_data):
        if 'password' not in validated_data:
            raise serializers.ValidationError({'password': 'La contraseña es obligatoria.'})
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)
    