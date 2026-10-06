from django.urls import path
from .views import ProveedorView, CategoriaView, TipoMaterialView, RecursoView, RecursoDetalleView

urlpatterns = [
    path('proveedores/', ProveedorView.as_view()),
    path('categorias/', CategoriaView.as_view()),
    path('tipos-material/', TipoMaterialView.as_view()),
    path('recursos/', RecursoView.as_view()),
    path('recursos/<int:id_recurso>/', RecursoDetalleView.as_view()),
]
