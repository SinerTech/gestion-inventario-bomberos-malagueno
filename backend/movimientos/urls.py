from django.urls import path
from .views import MotivoView, IngresoView, RetiroView, DevolucionView

urlpatterns = [
    path('motivos/', MotivoView.as_view()),
    path('ingresos/', IngresoView.as_view()),
    path('retiros/', RetiroView.as_view()),
    path('devoluciones/', DevolucionView.as_view()),
]