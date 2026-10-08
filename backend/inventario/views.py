from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import ProtectedError
from django.db.models import Count, Q
from .models import Proveedor, Categoria, TipoMaterial, Recurso, RecursoTipoMaterial, UnidadRecurso
from .serializers import (
    ProveedorSerializer, CategoriaSerializer,
    TipoMaterialSerializer, RecursoSerializer, UnidadRecursoSerializer, ResumenRecursoSerializer
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

class RecursoDetalleView(APIView):
    def obtener_recurso(self, id_recurso):
        return get_object_or_404(
            Recurso.objects
            .select_related('id_categoria')
            .prefetch_related('recursotipomaterial_set__id_tipo_material'),
            pk=id_recurso,
        )

    def put(self, request, id_recurso):
        recurso = self.obtener_recurso(id_recurso)
        serializer = RecursoSerializer(recurso, data=request.data)  
        if serializer.is_valid():
            try:
                serializer.save()
            except Exception:
                return Response(
                    {"error": "Ocurrió un error interno al modificar el recurso."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            # Se vuelve a leer el recurso para que la respuesta muestre los materiales actualizados
            recurso = self.obtener_recurso(id_recurso)
            return Response(
                {
                    "mensaje": "Recurso modificado correctamente.",
                    "recurso": RecursoSerializer(recurso).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id_recurso):
        recurso = self.obtener_recurso(id_recurso)
        try:
            # atomic: si el borrado del recurso falla, también se deshace el de sus materiales
            with transaction.atomic():
                RecursoTipoMaterial.objects.filter(id_recurso=recurso).delete()
                recurso.delete()
        except ProtectedError:
            return Response(
                {"error": "No se puede eliminar el recurso porque tiene unidades o movimientos asociados."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {"mensaje": "Recurso eliminado correctamente."},
            status=status.HTTP_200_OK,
        )

class ResumenInventarioView(APIView):
    def get(self, request):
        recursos = (
            Recurso.objects
            .select_related('id_categoria')
            .annotate(
                total_unidades=Count('unidadrecurso'),
                disponibles=Count(
                    'unidadrecurso', filter=Q(unidadrecurso__disponibilidad='Disponible')
                ),
                en_uso=Count(
                    'unidadrecurso', filter=Q(unidadrecurso__disponibilidad='En Uso')
                ),
                de_baja=Count(
                    'unidadrecurso', filter=Q(unidadrecurso__disponibilidad='De Baja')
                ),
                no_operativas=Count(
                    'unidadrecurso', filter=Q(unidadrecurso__estado__startswith='NoOp')
                ),
            )
            .order_by('nombre_recurso')
        )
        return Response(ResumenRecursoSerializer(recursos, many=True).data)


class UnidadRecursoView(APIView):
    def get(self, request):
        unidades = (
            UnidadRecurso.objects
            .select_related(
                'id_recurso__id_categoria', 'id_proveedor', 'id_usuario_asignado'
            )
            .order_by('id_unidad_recurso')
        )
        return Response(UnidadRecursoSerializer(unidades, many=True).data)
    