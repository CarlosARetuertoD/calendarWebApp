from rest_framework import viewsets
from .models import Pedido, Letra, GuiaDeRemision, Factura
from .serializers import PedidoSerializer, LetraSerializer, GuiaDeRemisionSerializer, FacturaSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer

class LetraViewSet(viewsets.ModelViewSet):
    queryset = Letra.objects.all()
    serializer_class = LetraSerializer

class GuiaDeRemisionViewSet(viewsets.ModelViewSet):
    queryset = GuiaDeRemision.objects.all()
    serializer_class = GuiaDeRemisionSerializer

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
