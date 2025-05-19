from rest_framework import serializers
from .models import (
    Empresa,
    Vendedor,
    Proveedor,
    Pedido,
    DistribucionFinal,
    Letra,
    GuiaDeRemision,
    Factura
)
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

# EMPRESA
class EmpresaSerializer(serializers.ModelSerializer):
    total_letras = serializers.SerializerMethodField()
    total_facturado = serializers.SerializerMethodField()
    letras_pendientes = serializers.SerializerMethodField()
    facturas_emitidas = serializers.SerializerMethodField()

    class Meta:
        model = Empresa
        fields = [
            'id', 'nombre', 'ruc', 'direccion', 'telefono', 
            'email_contacto', 'activo', 'total_letras', 'total_facturado',
            'letras_pendientes', 'facturas_emitidas', 'created_at', 
            'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def get_total_letras(self, obj):
        """Calcula el monto total de las letras asociadas a la empresa."""
        return obj.letras.aggregate(total=Sum('monto'))['total'] or 0

    def get_total_facturado(self, obj):
        """Calcula el monto total facturado para la empresa."""
        return Factura.objects.filter(
            guia_remision__empresa=obj
        ).aggregate(total=Sum('monto_factura'))['total'] or 0

    def get_letras_pendientes(self, obj):
        """Devuelve el número de letras pendientes de pago."""
        return obj.letras.filter(estado='pendiente').count()

    def get_facturas_emitidas(self, obj):
        """Devuelve el número de facturas emitidas para la empresa."""
        return Factura.objects.filter(guia_remision__empresa=obj).count()

    def validate_ruc(self, value):
        """Valida que el RUC tenga exactamente 11 dígitos numéricos."""
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError("El RUC debe tener 11 dígitos numéricos")
        return value


# VENDEDOR
class VendedorSerializer(serializers.ModelSerializer):
    proveedores_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendedor
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
        
    def get_proveedores_count(self, obj):
        """Devuelve la cantidad de proveedores asociados a este vendedor."""
        return obj.proveedor_set.count()
        
    def validate_telefono(self, value):
        """Valida que el teléfono tenga un formato válido."""
        if not value.isdigit() or len(value) < 7:
            raise serializers.ValidationError("Ingrese un número de teléfono válido")
        return value


# PROVEEDOR
class ProveedorSerializer(serializers.ModelSerializer):
    vendedor_nombre = serializers.CharField(source='vendedor.nombre', read_only=True)
    pedidos_count = serializers.SerializerMethodField()
    pedidos_pendientes = serializers.SerializerMethodField()
    monto_total_pedidos = serializers.SerializerMethodField()

    class Meta:
        model = Proveedor
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def get_pedidos_count(self, obj):
        """Devuelve la cantidad total de pedidos del proveedor."""
        return obj.pedidos.count()
        
    def get_pedidos_pendientes(self, obj):
        """Devuelve la cantidad de pedidos pendientes."""
        return obj.pedidos.filter(completado=False).count()
        
    def get_monto_total_pedidos(self, obj):
        """Calcula el monto total de pedidos del proveedor."""
        return obj.pedidos.aggregate(total=Sum('monto_total_pedido'))['total'] or 0
        
    def validate_color(self, value):
        """Valida que el color tenga un formato HEX válido."""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("El color debe estar en formato HEX (ej: #1976d2)")
        return value
        
    def validate_ruc(self, value):
        if value and (not value.isdigit() or len(value) != 11):
            raise serializers.ValidationError("El RUC debe tener 11 dígitos numéricos")
        return value


# LETRA
class LetraSerializer(serializers.ModelSerializer):
    proveedor = serializers.SerializerMethodField()
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    dias_restantes = serializers.SerializerMethodField()
    
    class Meta:
        model = Letra
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
        
    def get_proveedor(self, obj):
        """Obtiene el nombre del proveedor asociado a esta letra."""
        if obj.pedido and obj.pedido.proveedor:
            return obj.pedido.proveedor.nombre
        return None
        
    def get_dias_restantes(self, obj):
        """Calcula los días restantes hasta la fecha de pago."""
        if obj.estado == 'pagado':
            return 0
        today = timezone.now().date()
        return (obj.fecha_pago - today).days
        
    def validate(self, data):
        """Validación a nivel de objeto para la letra."""
        if data.get('monto', 0) <= 0:
            raise serializers.ValidationError({"monto": "El monto debe ser mayor que cero"})
            
        if data.get('fecha_pago') and data.get('fecha_pago') < timezone.now().date():
            raise serializers.ValidationError({"fecha_pago": "La fecha de pago no puede ser en el pasado"})
            
        return data
        
    def create(self, validated_data):
        """Personaliza la creación de letras para calcular la fecha de vencimiento con gracia."""
        letra = super().create(validated_data)
        
        # Calcular la fecha de vencimiento con período de gracia (3 días)
        if letra.fecha_pago:
            letra.fecha_vencimiento_gracia = letra.fecha_pago + timedelta(days=3)
            letra.save(update_fields=['fecha_vencimiento_gracia'])
            
        return letra


# DISTRIBUCIÓN FINAL
class DistribucionFinalSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    pedido_resumen = serializers.SerializerMethodField()
    total_letras = serializers.SerializerMethodField()
    letras_pendientes = serializers.SerializerMethodField()

    class Meta:
        model = DistribucionFinal
        fields = '__all__'

    def get_pedido_resumen(self, obj):
        return f"{obj.pedido.proveedor.nombre} - {obj.pedido.fecha_pedido}"

    def get_total_letras(self, obj):
        return obj.letras.aggregate(total=Sum('monto'))['total'] or 0
        
    def get_letras_pendientes(self, obj):
        return obj.letras.filter(estado='pendiente').count()
        
    def validate(self, data):
        """Validación personalizada para la distribución final."""
        if data.get('monto_final', 0) <= 0:
            raise serializers.ValidationError({"monto_final": "El monto debe ser mayor que cero"})
            
        return data


# FACTURA
class FacturaSerializer(serializers.ModelSerializer):
    empresa = serializers.SerializerMethodField()
    guia = serializers.SerializerMethodField()
    proveedor = serializers.SerializerMethodField()
    dias_vencimiento = serializers.SerializerMethodField()

    class Meta:
        model = Factura
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def get_empresa(self, obj):
        return obj.guia_remision.empresa.nombre

    def get_guia(self, obj):
        return obj.guia_remision.numero_guia
        
    def get_proveedor(self, obj):
        return obj.guia_remision.pedido.proveedor.nombre if obj.guia_remision.pedido else None
        
    def get_dias_vencimiento(self, obj):
        """Calcula los días para vencimiento o los días de vencida."""
        if not obj.fecha_vencimiento:
            return None
            
        today = timezone.now().date()
        return (obj.fecha_vencimiento - today).days
        
    def validate_numero_factura(self, value):
        """Valida el formato del número de factura."""
        if not (value.startswith('F') or value.startswith('E')):
            raise serializers.ValidationError("El número de factura debe comenzar con F o E")
        return value
        
    def validate(self, data):
        """Validación a nivel de objeto para la factura."""
        if data.get('monto_factura', 0) <= 0:
            raise serializers.ValidationError({"monto_factura": "El monto debe ser mayor que cero"})
            
        if data.get('fecha_vencimiento') and data.get('fecha_emision') and data.get('fecha_vencimiento') < data.get('fecha_emision'):
            raise serializers.ValidationError({"fecha_vencimiento": "La fecha de vencimiento no puede ser anterior a la fecha de emisión"})
            
        return data


# GUÍA DE REMISIÓN
class GuiaDeRemisionSerializer(serializers.ModelSerializer):
    empresa = serializers.CharField(source='empresa.nombre', read_only=True)
    proveedor = serializers.CharField(source='pedido.proveedor.nombre', read_only=True)
    facturas = FacturaSerializer(many=True, read_only=True)
    facturas_count = serializers.SerializerMethodField()
    monto_total_facturas = serializers.SerializerMethodField()

    class Meta:
        model = GuiaDeRemision
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
        
    def get_facturas_count(self, obj):
        """Devuelve la cantidad de facturas asociadas a esta guía."""
        return obj.facturas.count()
        
    def get_monto_total_facturas(self, obj):
        """Calcula el monto total de las facturas asociadas a esta guía."""
        return obj.facturas.aggregate(total=Sum('monto_factura'))['total'] or 0
        
    def validate_numero_guia(self, value):
        """Valida el formato del número de guía."""
        if not value.startswith('G'):
            raise serializers.ValidationError("El número de guía debe comenzar con G")
        return value
        
    def validate(self, data):
        """Validación a nivel de objeto para la guía de remisión."""
        if data.get('fecha_recepcion') and data.get('fecha_emision') and data.get('fecha_recepcion') < data.get('fecha_emision'):
            raise serializers.ValidationError({"fecha_recepcion": "La fecha de recepción no puede ser anterior a la fecha de emisión"})
            
        return data


# PEDIDO
class PedidoSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    letras = LetraSerializer(many=True, read_only=True)
    guias_remision = GuiaDeRemisionSerializer(many=True, read_only=True)
    distribuciones_finales = DistribucionFinalSerializer(many=True, read_only=True)
    letras_count = serializers.SerializerMethodField()
    guias_count = serializers.SerializerMethodField()
    distribuciones_count = serializers.SerializerMethodField()
    porcentaje_pagado = serializers.SerializerMethodField()
    tipo_pedido = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
        
    def get_letras_count(self, obj):
        """Devuelve la cantidad de letras asociadas a este pedido."""
        return obj.letras.count()
        
    def get_guias_count(self, obj):
        """Devuelve la cantidad de guías de remisión asociadas a este pedido."""
        return obj.guias_remision.count()
        
    def get_distribuciones_count(self, obj):
        """Devuelve la cantidad de distribuciones finales asociadas a este pedido."""
        return obj.distribuciones_finales.count()
        
    def get_porcentaje_pagado(self, obj):
        """Calcula el porcentaje del monto que ya se ha pagado."""
        if obj.monto_total_pedido == 0:
            return 0
        return round((obj.monto_pagado / obj.monto_total_pedido) * 100, 2)
    
    def get_tipo_pedido(self, obj):
        """Devuelve el tipo de pedido: contado o crédito."""
        return "Contado" if obj.es_contado else "Crédito"
        
    def validate(self, data):
        """Validación a nivel de objeto para el pedido."""
        if 'monto_total_pedido' in data and data.get('monto_total_pedido', 0) <= 0:
            raise serializers.ValidationError({"monto_total_pedido": "El monto debe ser mayor que cero"})
            
        if 'monto_pagado' in data and data.get('monto_pagado', 0) > data.get('monto_total_pedido', 0):
            raise serializers.ValidationError({"monto_pagado": "El monto pagado no puede ser mayor que el monto total"})
            
        return data
