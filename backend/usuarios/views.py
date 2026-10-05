from django.shortcuts import render
from rest_framework.views import APIView as ApiView
from rest_framework.response import Response
from rest_framework import status
from .models import Rol, Area, Usuario
from .serializers import UsuarioSerializer, RolSerializer, AreaSerializer
from django.shortcuts import get_object_or_404

class UsuarioView(ApiView):
    def get(self, request):
        usuarios = Usuario.objects.select_related('id_rol', 'id_area').order_by('id_usuario')
        return Response(UsuarioSerializer(usuarios, many=True).data)
    
    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
            except Exception:
                return Response(
                    {"error": "Ocurrio un error interno al registrar el usuario."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response(
                {"mensaje": "Usuario registrado correctamente.", "usuario": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RolView(ApiView):
    def get(self, request):
        roles = Rol.objects.all()
        return Response(RolSerializer(roles, many=True).data)

class AreaView(ApiView):
    def get(self, request):
        areas = Area.objects.all()
        return Response(AreaSerializer(areas, many=True).data)

class UsuarioDetalleView(ApiView):
    def obtener_usuario(self, id_usuario):
        return get_object_or_404(
            Usuario.objects.select_related('id_rol', 'id_area'),
            pk=id_usuario,
        )

    def put(self, request, id_usuario):
        usuario = self.obtener_usuario(id_usuario)
        serializer = UsuarioSerializer(usuario, data=request.data)  # sin partial
        if serializer.is_valid():
            try:
                serializer.save()
            except Exception:
                return Response(
                    {"error": "Ocurrió un error interno al modificar el usuario."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response(
                {"mensaje": "Usuario modificado correctamente.", "usuario": serializer.data},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id_usuario):
        usuario = self.obtener_usuario(id_usuario)
        if not usuario.activo:
            return Response(
                {"mensaje": "El usuario ya estaba dado de baja."},
                status=status.HTTP_200_OK,
            )
        usuario.activo = False
        usuario.save(update_fields=['activo'])
        return Response(
            {"mensaje": "Usuario dado de baja correctamente."},
            status=status.HTTP_200_OK,
        )
