from django.urls import path
from .views import MotivoView, IngresoView, RetiroView, DevolucionView, AlertaView, AlertaDetalleView

urlpatterns = [
    path('motivos/', MotivoView.as_view()),
    path('ingresos/', IngresoView.as_view()),
    path('retiros/', RetiroView.as_view()),
    path('devoluciones/', DevolucionView.as_view()),
    path('alertas/', AlertaView.as_view()),
    path('alertas/<int:id_alerta>/', AlertaDetalleView.as_view()),
]