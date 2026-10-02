from django.shortcuts import render
from rest_framework.views import APIView as ApiView
from rest_framework.response import Response
from rest_framework import status
from .models import Rol, Area, Usuario
from .serializers import UsuarioSerializer, RolSerializer, AreaSerializer

class UsuarioView(ApiView):
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
    def get(self, request):
        usuarios = Usuario.objects.all()
        return Response(UsuarioSerializer(usuarios, many=True).data)

class RolView(ApiView):
    def get(self, request):
        roles = Rol.objects.all()
        return Response(RolSerializer(roles, many=True).data)

class AreaView(ApiView):
    def get(self, request):
        areas = Area.objects.all()
        return Response(AreaSerializer(areas, many=True).data)
