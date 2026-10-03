from django.urls import path
from .views import ProveedorView, CategoriaView, TipoMaterialView, RecursoView

urlpatterns = [
    path('proveedores/', ProveedorView.as_view()),
    path('categorias/', CategoriaView.as_view()),
    path('tipos-material/', TipoMaterialView.as_view()),
    path('recursos/', RecursoView.as_view()),
]
