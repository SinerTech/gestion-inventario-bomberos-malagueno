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

class UserSerializer(serializers.ModelSerializer):
    rol = RolSerializer(source='id_rol', read_only=True)
    area = AreaSerializer(source='id_area', read_only=True)
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'nombre_usuario', 'email_usuario', 'password', 'id_rol', 'id_area', 'rol', 'area', 'activo',]
        read_only_fields = ['id_usuario', 'activo']
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_email_usuario(self, value):
        return value.lower()
    
    def validate_password(self, value):
        errores = []
        if len(value) < 8:
            errores.append("La contraseña debe incluir al menos 8 caracteres.")
        if not any(c.upper() for c in value):
            errores.append("La contraseña debe incluir al menos una MAYUSCULA.")
        if not any(c.lower() for c in value):
            errores.append("La contraseña debe incluir al menos una minuscula.")
        if not any(c.isdigit() for c in value):
            errores.append("La constraseña debe incluir al menos un número.")
        if errores:
            raise serializers.ValidationError(errores)
        return value
    
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    