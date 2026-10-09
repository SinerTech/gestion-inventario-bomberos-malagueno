from django.urls import path
from .views import UsuarioView, RolView, AreaView, UsuarioDetalleView, LoginView

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('usuarios/', UsuarioView.as_view()),
    path('usuarios/<int:id_usuario>/', UsuarioDetalleView.as_view()),
    path('roles/', RolView.as_view()),
    path('areas/', AreaView.as_view()),
]
