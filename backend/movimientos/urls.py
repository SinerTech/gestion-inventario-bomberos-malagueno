from django.urls import path
from .views import MotivoView, IngresoView, RetiroView

urlpatterns = [
    path('motivos/', MotivoView.as_view()),
    path('ingresos/', IngresoView.as_view()),
    path('retiros/', RetiroView.as_view()),
]