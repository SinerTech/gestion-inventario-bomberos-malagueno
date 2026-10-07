from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Motivo, TipoMovimiento
from .serializers import MotivoSerializer, IngresoSerializer
from .services import registrar_ingreso


class MotivoView(APIView):
    def get(self, request):
        motivos = Motivo.objects.order_by('nombre_motivo')
        return Response(MotivoSerializer(motivos, many=True).data)


class IngresoView(APIView):
    def post(self, request):
        serializer = IngresoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            unidades = registrar_ingreso(serializer.validated_data)
        except TipoMovimiento.DoesNotExist:
            return Response(
                {"error": "Falta cargar el tipo de movimiento 'Ingreso' en la base de datos."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            return Response(
                {"error": "Ocurrió un error interno al registrar el ingreso."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        recurso = serializer.validated_data['id_recurso']
        return Response(
            {
                "mensaje": f"Se registraron {len(unidades)} unidades de {recurso.nombre_recurso}.",
                "unidades": [
                    {
                        "id_unidad_recurso": u.id_unidad_recurso,
                        "codigo_interno": u.codigo_interno,
                    }
                    for u in unidades
                ],
            },
            status=status.HTTP_201_CREATED,
        )
