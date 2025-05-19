from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    GroupViewSet,
    PermissionViewSet,
    ContentTypeViewSet,
    RolPersonalizadoViewSet,
    SystemBackupViewSet,
    UserActivityViewSet,
    asignar_permisos_usuario
)

# Configurar el router
router = DefaultRouter()
router.register('usuarios', UserViewSet)
router.register('grupos', GroupViewSet)
router.register('permisos', PermissionViewSet)
router.register('content-types', ContentTypeViewSet)
router.register('roles', RolPersonalizadoViewSet)
router.register('respaldos', SystemBackupViewSet)
router.register('logs', UserActivityViewSet)

urlpatterns = [
    # Incluir rutas del router
    path('', include(router.urls)),
    
    # Rutas personalizadas
    path('usuarios/asignar-permisos/', asignar_permisos_usuario, name='asignar-permisos-usuario'),
] 