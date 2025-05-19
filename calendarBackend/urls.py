from django.urls import path, include
from rest_framework import routers
from .views import (
    EmpresaViewSet,
    VendedorViewSet,
    ProveedorViewSet,
    PedidoViewSet,
    LetraViewSet,
    GuiaDeRemisionViewSet,
    FacturaViewSet,
    DistribucionFinalViewSet,
    distribuciones_pendientes,
    crear_letras_masivamente,
    dashboard_estadisticas
)

router = routers.DefaultRouter()
router.register('empresas', EmpresaViewSet)
router.register('vendedores', VendedorViewSet)
router.register('proveedores', ProveedorViewSet)
router.register('pedidos', PedidoViewSet)
router.register('letras', LetraViewSet)
router.register('guias-remision', GuiaDeRemisionViewSet)
router.register('facturas', FacturaViewSet)
router.register('distribuciones-finales', DistribucionFinalViewSet)

# Registrar un segundo punto de acceso para DistribucionFinalViewSet
distribuciones_router = routers.DefaultRouter()
distribuciones_router.register('distribuciones', DistribucionFinalViewSet, basename='distribuciones')

urlpatterns = [
    path('distribuciones/no-asignadas/', distribuciones_pendientes),
    path('letras/bulk_create/', crear_letras_masivamente),
    path('dashboard/estadisticas/', dashboard_estadisticas, name='dashboard-estadisticas'),
    path('', include(router.urls)),
    path('', include(distribuciones_router.urls)),
]