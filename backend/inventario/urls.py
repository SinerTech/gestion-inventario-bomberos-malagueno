from django.urls import path
from .views import ProveedorView, CategoriaView, TipoMaterialView, RecursoView, RecursoDetalleView, ResumenInventarioView, UnidadRecursoView

urlpatterns = [
    path('proveedores/', ProveedorView.as_view()),
    path('categorias/', CategoriaView.as_view()),
    path('tipos-material/', TipoMaterialView.as_view()),
    path('recursos/', RecursoView.as_view()),
    path('recursos/<int:id_recurso>/', RecursoDetalleView.as_view()),
    path('inventario/resumen/', ResumenInventarioView.as_view()),
    path('unidades/', UnidadRecursoView.as_view()),
]
