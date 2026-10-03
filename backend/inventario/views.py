from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Proveedor
from .serializers import ProveedorSerializer


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
