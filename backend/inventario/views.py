from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Proveedor, Categoria, TipoMaterial, Recurso
from .serializers import (
    ProveedorSerializer, CategoriaSerializer,
    TipoMaterialSerializer, RecursoSerializer,
)

class ProveedorView(APIView):
    def get(self, request):
        proveedores = Proveedor.objects.order_by('id_proveedor')
        return Response(ProveedorSerializer(proveedores, many=True).data)

    def post(self, request):
        serializer = ProveedorSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
            except Exception:
                return Response(
                    {"error": "Ocurrió un error interno al registrar el proveedor."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response(
                {
                    "mensaje": "Proveedor registrado correctamente.",
                    "proveedor": serializer.data
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoriaView(APIView):
    def get(self, request):
        categorias = Categoria.objects.order_by('nombre_categoria')
        return Response(CategoriaSerializer(categorias, many=True).data)

class TipoMaterialView(APIView):
    def get(self, request):
        tipos = TipoMaterial.objects.order_by('nombre_tipo_material')
        return Response(TipoMaterialSerializer(tipos, many=True).data)

class RecursoView(APIView):
    def get(self, request):
        # select_related / prefetch_related evitan una consulta extra por cada recurso
        recursos = (
            Recurso.objects
            .select_related('id_categoria')
            .prefetch_related('recursotipomaterial_set__id_tipo_material')
            .order_by('id_recurso')
        )
        return Response(RecursoSerializer(recursos, many=True).data)
    
    def post(self, request):
        serializer = RecursoSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
            except Exception:
                return Response(
                    {"error": "Ocurrió un error interno al registrar el recurso."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response(
                {
                    "mensaje": "Recurso registrado correctamente.",
                    "recurso": serializer.data
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
