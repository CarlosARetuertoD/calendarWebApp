from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, 
    LogoutView, 
    ChangePasswordView,
    UserViewSet
)

# Configurar router para el viewset de usuarios
router = DefaultRouter()
router.register('usuarios', UserViewSet)

urlpatterns = [
    # Rutas de autenticación
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('cambiar-password/', ChangePasswordView.as_view(), name='cambiar-password'),
    
    # Incluir rutas del router
    path('', include(router.urls)),
] 