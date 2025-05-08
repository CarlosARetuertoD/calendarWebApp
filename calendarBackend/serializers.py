from rest_framework import serializers
from .models import Pedido, Letra, GuiaDeRemision, Factura

class FacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factura
        fields = '__all__'

class GuiaDeRemisionSerializer(serializers.ModelSerializer):
    facturas = FacturaSerializer(many=True, read_only=True)

    class Meta:
        model = GuiaDeRemision
        fields = '__all__'

class LetraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Letra
        fields = '__all__'

class PedidoSerializer(serializers.ModelSerializer):
    letras = LetraSerializer(many=True, read_only=True)
    guias_remision = GuiaDeRemisionSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = '__all__'
