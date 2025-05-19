from rest_framework import viewsets, permissions, status, filters, serializers
from django.db.models import Prefetch, Count, Sum, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from . import models
from .models import (
    Empresa,
    Vendedor,
    Proveedor,
    Pedido,
    Letra,
    GuiaDeRemision,
    Factura,
    DistribucionFinal
)
from .serializers import (
    EmpresaSerializer,
    VendedorSerializer,
    ProveedorSerializer,
    PedidoSerializer,
    LetraSerializer,
    GuiaDeRemisionSerializer,
    FacturaSerializer,
    DistribucionFinalSerializer
)

# Importamos los permisos personalizados de la app de autenticación
from authentication.views import IsSuperAdmin, IsAdminUser

# Mixin para aplicar permisos basados en roles
class RoleBasedPermissionMixin:
    def get_permissions(self):
        """
        - Superadmin y Admin pueden hacer todo
        - Usuario de solo lectura solo puede listar y obtener detalles
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]  # Solo admin y superadmin
        else:
            permission_classes = [permissions.IsAuthenticated]  # Cualquier usuario autenticado
            
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Añade automáticamente el usuario que crea el registro"""
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
        
    def perform_update(self, serializer):
        """Actualiza automáticamente el usuario que modifica el registro"""
        serializer.save(updated_by=self.request.user)


class EmpresaViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'ruc']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']
    
    def get_queryset(self):
        """Optimiza las consultas para reducir el número de queries"""
        queryset = Empresa.objects.all()
        
        # Si estamos obteniendo el detalle, hacemos prefetch de relaciones
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                'letras', 
                'guias_remision__facturas'
            )
        
        return queryset


class VendedorViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = Vendedor.objects.all()
    serializer_class = VendedorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'telefono', 'email']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']
    
    def get_queryset(self):
        queryset = Vendedor.objects.all()
        
        # Filtrar vendedores activos si se especifica en la URL
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset


class ProveedorViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'ruc', 'vendedor__nombre']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']
    
    def get_queryset(self):
        queryset = Proveedor.objects.all().select_related('vendedor')
        
        # Filtrar por vendedor si se especifica en la URL
        vendedor_id = self.request.query_params.get('vendedor', None)
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)
            
        # Filtrar proveedores activos si se especifica en la URL
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def pedidos(self, request, pk=None):
        """Endpoint para obtener los pedidos de un proveedor específico"""
        proveedor = self.get_object()
        pedidos = Pedido.objects.filter(proveedor=proveedor).order_by('-fecha_pedido')
        serializer = PedidoSerializer(pedidos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def listado_ordenado(self, request):
        """Retorna un listado simplificado de proveedores ordenados por nombre"""
        proveedores = Proveedor.objects.all().order_by('nombre')
        
        # Usar un serializador más liviano con solo los campos necesarios
        class ProveedorSimpleSerializer(serializers.ModelSerializer):
            class Meta:
                model = Proveedor
                fields = ['id', 'nombre', 'identificador', 'color']
        
        serializer = ProveedorSimpleSerializer(proveedores, many=True)
        return Response(serializer.data)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class PedidoViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['proveedor__nombre', 'descripcion', 'numero_pedido']
    ordering_fields = ['fecha_pedido', 'monto_total_pedido', 'estado', 'proveedor__nombre', 'es_contado']
    ordering = ['-fecha_pedido']
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Pedido.objects.select_related('proveedor')
        
        # Verificar si estamos ordenando por proveedor
        ordering = self.request.query_params.get('ordering', None)
        if ordering and ('proveedor__nombre' in ordering or '-proveedor__nombre' in ordering):
            # Si ordenamos por proveedor, asegurarnos de hacer el join correctamente
            queryset = queryset.select_related('proveedor')
        
        # Filtrar por proveedor
        proveedor_id = self.request.query_params.get('proveedor', None)
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
            
        # Filtrar por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
            
        # Filtrar por completado
        completado = self.request.query_params.get('completado', None)
        if completado is not None:
            queryset = queryset.filter(completado=completado.lower() == 'true')
            
        # Filtrar por fecha específica
        fecha = self.request.query_params.get('fecha', None)
        if fecha:
            queryset = queryset.filter(fecha_pedido=fecha)
        
        # Filtrar por tipo de pedido (contado o crédito)
        tipo = self.request.query_params.get('es_contado', None)
        if tipo is not None:
            es_contado = tipo.lower() == 'true'
            queryset = queryset.filter(es_contado=es_contado)
        
        # Para consultas detalladas, optimizamos con prefetch
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                'letras__empresa',
                'guias_remision__empresa',
                'guias_remision__facturas',
                'distribuciones_finales__empresa',
                'distribuciones_finales__letras'
            )
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def marcar_asignado(self, request, pk=None):
        """Marca un pedido como asignado después de la distribución inicial"""
        pedido = self.get_object()
        
        # Calcular el monto final basado en las distribuciones actuales
        monto_final = pedido.calcular_monto_final()
        
        # Actualizar estado a asignado
        pedido.estado = 'asignado'
        pedido.save(update_fields=['estado', 'updated_at'])
        
        return Response({
            'status': 'pedido marcado como asignado',
            'monto_total_pedido': float(pedido.monto_total_pedido),
            'monto_final_pedido': float(monto_final),
            'diferencia': float(pedido.monto_total_pedido - monto_final)
        })
    
    @action(detail=True, methods=['get'])
    def resumen(self, request, pk=None):
        """Devuelve un resumen de las estadísticas del pedido"""
        pedido = self.get_object()
        
        # Calcular estadísticas
        total_distribuciones = pedido.distribuciones_finales.aggregate(total=Sum('monto_final'))['total'] or 0
        total_letras = pedido.letras.aggregate(total=Sum('monto'))['total'] or 0
        letras_pendientes = pedido.letras.filter(estado='pendiente').count()
        letras_pagadas = pedido.letras.filter(estado='pagado').count()
        
        return Response({
            'id': pedido.id,
            'proveedor': pedido.proveedor.nombre,
            'monto_total_pedido': float(pedido.monto_total_pedido),
            'monto_final_pedido': float(pedido.monto_final_pedido) if pedido.monto_final_pedido else None,
            'monto_pagado': float(pedido.monto_pagado),
            'porcentaje_pagado': float(pedido.monto_pagado / pedido.monto_total_pedido * 100) if pedido.monto_total_pedido else 0,
            'total_distribuciones': float(total_distribuciones),
            'total_letras': float(total_letras),
            'letras_pendientes': letras_pendientes,
            'letras_pagadas': letras_pagadas,
            'estado': pedido.estado,
            'completado': pedido.completado
        })


class LetraViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = Letra.objects.all()
    serializer_class = LetraSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['pedido__proveedor__nombre', 'empresa__nombre', 'numero_unico']
    ordering_fields = ['fecha_pago', 'monto', 'estado']
    ordering = ['fecha_pago']
    
    def get_queryset(self):
        queryset = Letra.objects.select_related(
            'pedido__proveedor', 
            'empresa', 
            'distribucion'
        )
        
        # Filtrar por rango de fechas de pago
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        
        if fecha_desde:
            queryset = queryset.filter(fecha_pago__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_pago__lte=fecha_hasta)
            
        # Filtrar por empresa
        empresa_id = self.request.query_params.get('empresa', None)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
            
        # Filtrar por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
            
        # Filtrar por proveedor (a través del pedido)
        proveedor_id = self.request.query_params.get('proveedor', None)
        if proveedor_id:
            queryset = queryset.filter(pedido__proveedor_id=proveedor_id)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def marcar_pagada(self, request, pk=None):
        """Marca una letra como pagada"""
        letra = self.get_object()
        
        # Datos de pago
        fecha_pago_real = request.data.get('fecha_pago_real', timezone.now().date())
        banco = request.data.get('banco', '')
        numero_operacion = request.data.get('numero_operacion', '')
        notas = request.data.get('notas', '')
        
        letra.estado = 'pagado'
        letra.fecha_pago_real = fecha_pago_real
        letra.banco = banco
        letra.numero_operacion = numero_operacion
        letra.notas = notas
        letra.save()
        
        # Actualizar monto pagado del pedido si existe
        if letra.pedido:
            letra.pedido.monto_pagado += letra.monto
            letra.pedido.save(update_fields=['monto_pagado', 'updated_at'])
        
        return Response({'status': 'letra marcada como pagada'})
    
    @action(detail=False, methods=['get'])
    def proximas_vencer(self, request):
        """Devuelve letras próximas a vencer (30 días)"""
        hoy = timezone.now().date()
        limite = hoy + timezone.timedelta(days=30)
        
        letras = Letra.objects.filter(
            estado='pendiente',
            fecha_pago__gte=hoy,
            fecha_pago__lte=limite
        ).select_related('pedido__proveedor', 'empresa').order_by('fecha_pago')
        
        serializer = self.get_serializer(letras, many=True)
        return Response(serializer.data)


class GuiaDeRemisionViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = GuiaDeRemision.objects.all()
    serializer_class = GuiaDeRemisionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_guia', 'pedido__proveedor__nombre', 'empresa__nombre']
    ordering_fields = ['fecha_emision', 'estado']
    ordering = ['-fecha_emision']
    
    def get_queryset(self):
        queryset = GuiaDeRemision.objects.select_related(
            'pedido__proveedor', 
            'empresa'
        ).prefetch_related('facturas')
        
        # Filtrar por empresa
        empresa_id = self.request.query_params.get('empresa', None)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
            
        # Filtrar por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
            
        # Filtrar por pedido
        pedido_id = self.request.query_params.get('pedido', None)
        if pedido_id:
            queryset = queryset.filter(pedido_id=pedido_id)
            
        return queryset


class FacturaViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_factura', 'guia_remision__numero_guia', 'guia_remision__empresa__nombre']
    ordering_fields = ['fecha_emision', 'fecha_vencimiento', 'estado']
    ordering = ['-fecha_emision']
    
    def get_queryset(self):
        queryset = Factura.objects.select_related(
            'guia_remision__pedido__proveedor', 
            'guia_remision__empresa'
        )
        
        # Filtrar por guía de remisión
        guia_id = self.request.query_params.get('guia', None)
        if guia_id:
            queryset = queryset.filter(guia_remision_id=guia_id)
            
        # Filtrar por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
            
        # Filtrar por empresa (a través de la guía)
        empresa_id = self.request.query_params.get('empresa', None)
        if empresa_id:
            queryset = queryset.filter(guia_remision__empresa_id=empresa_id)
            
        # Filtrar facturas vencidas
        vencidas = self.request.query_params.get('vencidas', None)
        if vencidas and vencidas.lower() == 'true':
            hoy = timezone.now().date()
            queryset = queryset.filter(
                fecha_vencimiento__lt=hoy,
                estado='emitida'
            )
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def marcar_pagada(self, request, pk=None):
        """Marca una factura como pagada"""
        factura = self.get_object()
        factura.estado = 'pagada'
        factura.save(update_fields=['estado', 'updated_at'])
        return Response({'status': 'factura marcada como pagada'})


class DistribucionFinalViewSet(RoleBasedPermissionMixin, viewsets.ModelViewSet):
    queryset = DistribucionFinal.objects.all()
    serializer_class = DistribucionFinalSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['pedido__proveedor__nombre', 'empresa__nombre']
    ordering_fields = ['monto_final', 'pedido__fecha_pedido']
    ordering = ['-pedido__fecha_pedido']
    
    def get_queryset(self):
        queryset = DistribucionFinal.objects.select_related(
            'pedido__proveedor', 
            'empresa'
        ).prefetch_related('letras')
        
        # Filtrar por pedido
        pedido_id = self.request.query_params.get('pedido', None)
        if pedido_id:
            queryset = queryset.filter(pedido_id=pedido_id)
            
        # Filtrar por empresa
        empresa_id = self.request.query_params.get('empresa', None)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
            
        return queryset
    
    def perform_create(self, serializer):
        """Al crear una distribución, registra el usuario y actualiza el estado del pedido"""
        distribucion = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        
        # Verificar si es la primera distribución y actualizar el estado del pedido a "asignado"
        pedido = distribucion.pedido
        
        # Si el pedido todavía está pendiente, marcarlo como asignado
        if pedido.estado == 'pendiente':
            pedido.estado = 'asignado'
            pedido.save(update_fields=['estado', 'updated_at'])
        
        # Si el pedido es al contado, verificar si se debe marcar como completado
        if pedido.es_contado:
            # Calcular el total asignado a distribuciones
            total_distribuciones = DistribucionFinal.objects.filter(
                pedido=pedido
            ).aggregate(total=Sum('monto_final'))['total'] or 0
            
            # Si el total distribuido es igual al monto total del pedido, marcar como completado
            if total_distribuciones >= pedido.monto_total_pedido:
                pedido.completado = True
                pedido.estado = 'completado'
                pedido.save(update_fields=['completado', 'estado'])
    
    def perform_update(self, serializer):
        """Al actualizar una distribución, registra el usuario y verifica si debe completar pedido al contado"""
        distribucion = serializer.save(updated_by=self.request.user)
        
        # Si el pedido es al contado, verificar si se debe marcar como completado
        pedido = distribucion.pedido
        if pedido.es_contado:
            # Calcular el total asignado a distribuciones
            total_distribuciones = DistribucionFinal.objects.filter(
                pedido=pedido
            ).aggregate(total=Sum('monto_final'))['total'] or 0
            
            # Si el total distribuido es igual al monto total del pedido, marcar como completado
            if total_distribuciones >= pedido.monto_total_pedido:
                pedido.completado = True
                pedido.estado = 'completado'
                pedido.save(update_fields=['completado', 'estado'])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def distribuciones_pendientes(request):
    """Obtiene las distribuciones que aún tienen monto disponible para asignar letras"""
    
    # Anotar cada distribución con el total de letras
    distribuciones = DistribucionFinal.objects.annotate(
        total_letras=Sum('letras__monto')
    ).filter(
        Q(total_letras__lt=models.F('monto_final')) | 
        Q(total_letras__isnull=True)
    ).select_related('pedido__proveedor', 'empresa')
    
    serializer = DistribucionFinalSerializer(distribuciones, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def crear_letras_masivamente(request):
    """
    Crea múltiples letras en una sola operación
    """
    distribucion_id = request.data.get('distribucion_id')
    montos = request.data.get('montos', [])
    fechas = request.data.get('fechas', [])
    
    if not distribucion_id or not montos or not fechas or len(montos) != len(fechas):
        return Response(
            {'error': 'Datos inválidos'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    distribucion = get_object_or_404(DistribucionFinal, id=distribucion_id)
    
    # Verificar que no exceda el monto disponible
    suma_actual = distribucion.letras.aggregate(total=Sum('monto'))['total'] or 0
    monto_disponible = float(distribucion.monto_final) - float(suma_actual)
    suma_nueva = sum(float(m) for m in montos)
    
    if suma_nueva > monto_disponible:
        return Response(
            {'error': f'El monto total {suma_nueva} excede lo disponible {monto_disponible}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Crear las letras
    letras_creadas = []
    for i in range(len(montos)):
        letra = Letra.objects.create(
            pedido=distribucion.pedido,
            distribucion=distribucion,
            empresa=distribucion.empresa,
            monto=montos[i],
            fecha_pago=fechas[i],
            estado='pendiente',
            created_by=request.user,
            updated_by=request.user
        )
        
        # Calcular fecha de vencimiento con gracia (3 días)
        letra.fecha_vencimiento_gracia = letra.fecha_pago + timezone.timedelta(days=3)
        letra.save(update_fields=['fecha_vencimiento_gracia'])
        
        letras_creadas.append(letra)
    
    serializer = LetraSerializer(letras_creadas, many=True)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_estadisticas(request):
    """
    Proporciona estadísticas para el dashboard
    Solo admins y superadmins pueden ver todas las estadísticas
    """
    hoy = timezone.now().date()
    
    # Estadísticas de letras
    letras_pendientes = Letra.objects.filter(estado='pendiente').count()
    letras_proximas = Letra.objects.filter(
        estado='pendiente',
        fecha_pago__gte=hoy,
        fecha_pago__lte=hoy + timezone.timedelta(days=30)
    ).count()
    letras_atrasadas = Letra.objects.filter(
        estado='atrasado'
    ).count()
    letras_pagadas = Letra.objects.filter(
        estado='pagado',
        fecha_pago_real__gte=hoy - timezone.timedelta(days=30)
    ).count()
    
    # Montos de letras
    monto_pendiente = Letra.objects.filter(
        estado='pendiente'
    ).aggregate(total=Sum('monto'))['total'] or 0
    
    monto_proximo = Letra.objects.filter(
        estado='pendiente',
        fecha_pago__gte=hoy,
        fecha_pago__lte=hoy + timezone.timedelta(days=30)
    ).aggregate(total=Sum('monto'))['total'] or 0
    
    # Estadísticas de pedidos
    pedidos_pendientes = Pedido.objects.filter(completado=False).count()
    pedidos_recientes = Pedido.objects.filter(
        fecha_pedido__gte=hoy - timezone.timedelta(days=30)
    ).count()
    
    # Contadores por tipo de pedido
    pedidos_contado = Pedido.objects.filter(es_contado=True).count()
    pedidos_credito = Pedido.objects.filter(es_contado=False).count()
    
    # Estadísticas de pedidos recientes por tipo (última semana)
    pedidos_recientes_contado = Pedido.objects.filter(
        es_contado=True,
        fecha_pedido__gte=hoy - timezone.timedelta(days=7)
    ).count()
    
    pedidos_recientes_credito = Pedido.objects.filter(
        es_contado=False,
        fecha_pedido__gte=hoy - timezone.timedelta(days=7)
    ).count()
    
    # Montos por tipo de pedido
    monto_pedidos_contado = Pedido.objects.filter(
        es_contado=True
    ).aggregate(total=Sum('monto_total'))['total'] or 0
    
    monto_pedidos_credito = Pedido.objects.filter(
        es_contado=False
    ).aggregate(total=Sum('monto_total'))['total'] or 0
    
    # Monto total de pedidos recientes
    monto_pedidos_recientes = Pedido.objects.filter(
        fecha_pedido__gte=hoy - timezone.timedelta(days=30)
    ).aggregate(total=Sum('monto_total'))['total'] or 0
    
    # Estadísticas por empresa (solo para admin y superadmin)
    empresas_stats = []
    if request.user.perfil.es_admin:
        empresas = Empresa.objects.all()
        for empresa in empresas:
            # Letras pendientes y monto para esta empresa
            letras_empresa = Letra.objects.filter(
                empresa=empresa,
                estado='pendiente'
            )
            monto_pendiente_empresa = letras_empresa.aggregate(total=Sum('monto'))['total'] or 0
            
            # Facturas pendientes
            facturas_pendientes = Factura.objects.filter(
                guia_remision__empresa=empresa,
                estado='emitida'
            ).count()
            
            empresas_stats.append({
                'id': empresa.id,
                'nombre': empresa.nombre,
                'letras_pendientes': letras_empresa.count(),
                'monto_pendiente': float(monto_pendiente_empresa),
                'facturas_pendientes': facturas_pendientes
            })
    
    # Estadísticas por proveedor (solo para admin y superadmin)
    proveedores_stats = []
    if request.user.perfil.es_admin:
        proveedores = Proveedor.objects.filter(activo=True)
        for proveedor in proveedores:
            # Pedidos pendientes de este proveedor
            pedidos_proveedor = Pedido.objects.filter(
                proveedor=proveedor,
                completado=False
            )
            
            # Letras pendientes asociadas a este proveedor
            letras_proveedor = Letra.objects.filter(
                pedido__proveedor=proveedor,
                estado='pendiente'
            )
            monto_pendiente_proveedor = letras_proveedor.aggregate(total=Sum('monto'))['total'] or 0
            
            proveedores_stats.append({
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'pedidos_pendientes': pedidos_proveedor.count(),
                'letras_pendientes': letras_proveedor.count(),
                'monto_pendiente': float(monto_pendiente_proveedor)
            })
            
    # Próximos vencimientos (letras a vencer en los próximos 7 días)
    proximos_vencimientos = []
    letras_proximas_semana = Letra.objects.filter(
        estado='pendiente',
        fecha_pago__gte=hoy,
        fecha_pago__lte=hoy + timezone.timedelta(days=7)
    ).select_related('empresa', 'pedido__proveedor').order_by('fecha_pago')[:10]
    
    for letra in letras_proximas_semana:
        proximos_vencimientos.append({
            'id': letra.id,
            'fecha_pago': letra.fecha_pago,
            'monto': float(letra.monto),
            'empresa': letra.empresa.nombre if letra.empresa else None,
            'proveedor': letra.pedido.proveedor.nombre if letra.pedido and letra.pedido.proveedor else None,
            'dias_restantes': (letra.fecha_pago - hoy).days
        })
    
    # Armamos la respuesta
    return Response({
        'estadisticas_generales': {
            'letras_pendientes': letras_pendientes,
            'letras_proximas': letras_proximas,
            'letras_atrasadas': letras_atrasadas,
            'letras_pagadas_recientes': letras_pagadas,
            'monto_pendiente': float(monto_pendiente),
            'monto_proximo': float(monto_proximo),
            'pedidos_pendientes': pedidos_pendientes,
            'pedidos_recientes': pedidos_recientes,
            'pedidos_contado': pedidos_contado,
            'pedidos_credito': pedidos_credito,
            'pedidos_recientes_contado': pedidos_recientes_contado,
            'pedidos_recientes_credito': pedidos_recientes_credito,
            'monto_pedidos_contado': float(monto_pedidos_contado),
            'monto_pedidos_credito': float(monto_pedidos_credito),
            'monto_pedidos_recientes': float(monto_pedidos_recientes)
        },
        'empresas': empresas_stats,
        'proveedores': proveedores_stats,
        'proximos_vencimientos': proximos_vencimientos
    })