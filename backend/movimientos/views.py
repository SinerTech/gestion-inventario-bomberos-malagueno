from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Motivo, TipoMovimiento, Alerta
from .serializers import MotivoSerializer, IngresoSerializer, RetiroSerializer, DevolucionSerializer, NovedadSerializer, AlertaSerializer
from .services import registrar_ingreso, registrar_retiro, RetiroInvalido, registrar_devolucion, DevolucionInvalida, registrar_novedad, NovedadInvalida
from .constantes import nombres_motivos

class MotivoView(APIView):
    def get(self, request):
        motivos = Motivo.objects.order_by('nombre_motivo')
        return Response(MotivoSerializer(motivos, many=True).data)

class MotivoView(APIView):
    def get(self, request):
        motivos = Motivo.objects.order_by('nombre_motivo')
        # /api/motivos/?tipo=Retiro
        tipo = request.query_params.get('tipo')
        if tipo:
            motivos = motivos.filter(nombre_motivo__in=nombres_motivos(tipo))
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

class RetiroView(APIView):
    def post(self, request):
        serializer = RetiroSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            unidades = registrar_retiro(serializer.validated_data)
        except RetiroInvalido as e:
            return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)
        except TipoMovimiento.DoesNotExist:
            return Response(
                {"error": "Falta cargar el tipo de movimiento 'Retiro' en la base de datos."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            return Response(
                {"error": "Ocurrió un error interno al registrar el retiro."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        retira = serializer.validated_data['id_usuario_retira']
        return Response(
            {
                "mensaje": f"Se registró el retiro de {len(unidades)} unidad(es) "
                           f"a nombre de {retira.nombre_usuario}.",
                "unidades": [
                    {"id_unidad_recurso": u.id_unidad_recurso, "codigo_interno": u.codigo_interno}
                    for u in unidades
                ],
            },
            status=status.HTTP_201_CREATED,
        )
        
class DevolucionView(APIView):
    def post(self, request):
        serializer = DevolucionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            unidades = registrar_devolucion(serializer.validated_data)
        except DevolucionInvalida as e:
            return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)
        except Exception:
            return Response(
                {"error": "Ocurrió un error interno al registrar la devolución."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        devuelve = serializer.validated_data['id_usuario_devuelve']
        return Response(
            {
                "mensaje": f"Se registró la devolución de {len(unidades)} unidad(es) "
                           f"de {devuelve.nombre_usuario}.",
                "unidades": [
                    {"id_unidad_recurso": u.id_unidad_recurso, "codigo_interno": u.codigo_interno}
                    for u in unidades
                ],
            },
            status=status.HTTP_201_CREATED,
        )

class AlertaView(APIView):
    def get(self, request):
        alertas = (
            Alerta.objects
            .select_related('id_unidad_recurso__id_recurso')
            .order_by('-fecha_generada')
        )
        # Filtros opcionales: /api/alertas/?id_usuario_reporta=3&estado_alerta=Pendiente
        id_usuario = request.query_params.get('id_usuario_reporta')
        if id_usuario and id_usuario.isdigit():
            alertas = alertas.filter(id_usuario_reporta=id_usuario)
        estado = request.query_params.get('estado_alerta')
        if estado:
            alertas = alertas.filter(estado_alerta=estado)
        return Response(AlertaSerializer(alertas, many=True).data)

    def post(self, request):
        serializer = NovedadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            alerta = registrar_novedad(serializer.validated_data)
        except NovedadInvalida as e:
            return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)
        except Exception:
            return Response(
                {"error": "Ocurrió un error interno al registrar la novedad."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "mensaje": "Novedad registrada correctamente. El administrador podrá revisarla desde la gestión de alertas.",
                "alerta": AlertaSerializer(alerta).data,
            },
            status=status.HTTP_201_CREATED,
        )
    