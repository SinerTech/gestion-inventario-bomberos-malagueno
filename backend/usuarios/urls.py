from django.urls import path
from .views import UsuarioView, RolView, AreaView

urlpatterns = [
    path('usuarios/', UsuarioView.as_view()),
    path('roles/', RolView.as_view()),
    path('areas/', AreaView.as_view()),
]
