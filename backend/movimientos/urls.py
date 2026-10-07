from django.urls import path
from .views import MotivoView, IngresoView

urlpatterns = [
    path('motivos/', MotivoView.as_view()),
    path('ingresos/', IngresoView.as_view()),
]