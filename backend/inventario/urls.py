from django.urls import path
from .views import ProveedorView

urlpatterns = [
    path('proveedores/', ProveedorView.as_view()),
]
