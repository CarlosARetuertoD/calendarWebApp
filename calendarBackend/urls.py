from django.urls import path, include
from rest_framework import routers
from .views import PedidoViewSet, LetraViewSet, GuiaDeRemisionViewSet, FacturaViewSet

router = routers.DefaultRouter()
router.register('pedidos', PedidoViewSet)
router.register('letras', LetraViewSet)
router.register('guias-remision', GuiaDeRemisionViewSet)
router.register('facturas', FacturaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]