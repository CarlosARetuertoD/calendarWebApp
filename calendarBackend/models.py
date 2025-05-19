import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Empresa(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    ruc = models.CharField(max_length=11, unique=True)
    # Nuevos campos
    direccion = models.CharField(max_length=200, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    email_contacto = models.EmailField(blank=True)
    activo = models.BooleanField(default=True)
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="empresas_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="empresas_updated", blank=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['ruc']),
        ]

    def __str__(self):
        return self.nombre

class Vendedor(models.Model):
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    contacto_opcional = models.CharField(max_length=100, blank=True, null=True)
    # Nuevos campos
    email = models.EmailField(blank=True)
    notas = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="vendedores_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="vendedores_updated", blank=True)

    class Meta:
        verbose_name = "Vendedor"
        verbose_name_plural = "Vendedores"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['activo']),
        ]

    def __str__(self):
        return self.nombre

class Proveedor(models.Model):
    nombre = models.CharField(max_length=100)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, null=True, blank=True)
    identificador = models.CharField(max_length=10, help_text="Código corto para identificar al proveedor (ej: PION, RED)", blank=True)
    color = models.CharField(
        max_length=7,
        default='#1976d2',
        help_text="Código HEX del color (ej: #1976d2)"
    )
    # Nuevos campos
    ruc = models.CharField(max_length=11, blank=True, null=True)
    direccion = models.CharField(max_length=200, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    plazo_credito_default = models.IntegerField(default=60, help_text="Plazo de crédito en días")
    activo = models.BooleanField(default=True)
    notas = models.TextField(blank=True)
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="proveedores_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="proveedores_updated", blank=True)

    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['activo']),
            models.Index(fields=['ruc']),
        ]

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        # Si no hay identificador, crear uno a partir del nombre
        if not self.identificador:
            # Tomar las primeras 4 letras del nombre y convertir a mayúsculas
            self.identificador = self.nombre[:4].upper()
        super().save(*args, **kwargs)

class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('asignado', 'Asignado'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='pedidos')
    monto_total_pedido = models.DecimalField(max_digits=12, decimal_places=2, help_text="Monto total inicial del pedido")
    monto_final_pedido = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Monto final real del pedido después de completarlo")
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_pedido = models.DateField()
    plazo_dias = models.IntegerField(default=90)
    # Nuevos campos
    completado = models.BooleanField(default=False)
    monto_pagado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    numero_pedido = models.CharField(max_length=50, blank=True, null=True)
    es_contado = models.BooleanField(default=False, verbose_name="Es al contado")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="pedidos_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="pedidos_updated", blank=True)

    class Meta:
        ordering = ["-fecha_pedido"]
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_pedido']),
            models.Index(fields=['completado']),
            models.Index(fields=['proveedor']),
            models.Index(fields=['proveedor', 'fecha_pedido'], name='proveedor_fecha_idx'),
            models.Index(fields=['es_contado'], name='pedido_tipo_idx'),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre} - S/ {self.monto_total_pedido} ({self.fecha_pedido:%d/%m/%Y})"
    
    def save(self, *args, **kwargs):
        # Solo generar número si no existe y si hay proveedor asignado
        if not self.numero_pedido and self.proveedor_id:
            try:
                # Obtener el identificador del proveedor
                identificador = self.proveedor.identificador or self.proveedor.nombre[:4].upper()
                
                # Formatear la fecha como DDMMYY
                fecha_formateada = self.fecha_pedido.strftime("%d%m%y")
                
                # Buscar último pedido del mismo proveedor para el secuencial
                ultimo_pedido = Pedido.objects.filter(
                    proveedor=self.proveedor
                ).exclude(
                    id=self.id  # Excluir el pedido actual si ya existe
                ).order_by('-created_at').first()
                
                secuencial = 1
                if ultimo_pedido and ultimo_pedido.numero_pedido:
                    try:
                        # Intentar extraer el secuencial del final del número de pedido
                        secuencial_str = ultimo_pedido.numero_pedido[-2:]  # Últimos 2 dígitos
                        secuencial = int(secuencial_str) + 1
                    except (ValueError, IndexError):
                        # Si hay algún error al extraer, simplemente usar 1
                        secuencial = 1
                
                # Formato final: [IDENTIFICADOR][DDMMYY][SECUENCIAL]
                self.numero_pedido = f"{identificador}{fecha_formateada}{secuencial:02d}"
            except Exception as e:
                # En caso de error, registrarlo pero no impedir guardar el pedido
                print(f"Error al generar número de pedido: {e}")
        
        super().save(*args, **kwargs)
    
    def calcular_monto_pagado(self):
        """Calcula el monto total pagado a través de letras"""
        total = 0
        for distribucion in self.distribuciones_finales.all():
            for letra in distribucion.letras.filter(estado='pagado'):
                total += letra.monto
        self.monto_pagado = total
        self.save(update_fields=['monto_pagado'])
        return total

    def calcular_monto_final(self):
        """Calcula el monto final real basado en las distribuciones"""
        total_distribuciones = sum(dist.monto_final for dist in self.distribuciones_finales.all())
        self.monto_final_pedido = total_distribuciones
        self.save(update_fields=['monto_final_pedido'])
        return total_distribuciones

class DistribucionFinal(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='distribuciones_finales')
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='distribuciones')
    monto_final = models.DecimalField(max_digits=12, decimal_places=2)
    # Nuevos campos
    monto_en_letras = models.DecimalField(max_digits=12, decimal_places=2, default=0, 
                                         help_text="Monto asignado en letras (se actualiza automáticamente)")
    monto_disponible = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                          help_text="Monto disponible para asignar en letras")
    completado = models.BooleanField(default=False)
    fecha_distribucion = models.DateField(auto_now_add=True)
    notas = models.TextField(blank=True)
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="distribuciones_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="distribuciones_updated", blank=True)

    class Meta:
        verbose_name = "Distribución Final"
        verbose_name_plural = "Distribuciones Finales"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['completado']),
            models.Index(fields=['fecha_distribucion']),
        ]

    def __str__(self):
        return f"{self.empresa.nombre} - S/ {self.monto_final}"
    
    def calcular_montos(self):
        """Actualiza los montos en letras y disponible"""
        total_letras = sum(letra.monto for letra in self.letras.all())
        self.monto_en_letras = total_letras
        self.monto_disponible = self.monto_final - total_letras
        self.completado = (self.monto_disponible <= 0)
        self.save(update_fields=['monto_en_letras', 'monto_disponible', 'completado'])
        
        # Verificar si todas las distribuciones del pedido están completas
        # y el pedido está en estado "asignado", entonces marcar como "completado"
        if self.completado and self.pedido.estado == 'asignado':
            # Contar distribuciones totales y completas
            todas_distribuciones = self.pedido.distribuciones_finales.all()
            distribuciones_completas = [d for d in todas_distribuciones if d.completado]
            
            # Si todas las distribuciones están completas, marcar el pedido como completado
            if len(todas_distribuciones) > 0 and len(todas_distribuciones) == len(distribuciones_completas):
                self.pedido.estado = 'completado'
                self.pedido.completado = True
                self.pedido.save(update_fields=['estado', 'completado', 'updated_at'])
        
        return self.monto_disponible
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.monto_disponible = self.monto_final
            self.save(update_fields=['monto_disponible'])

class Letra(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('atrasado', 'Atrasado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_unico = models.CharField(max_length=20, unique=True, null=True, blank=True)
    pedido = models.ForeignKey('Pedido', on_delete=models.CASCADE, null=True, blank=True, related_name='letras')
    distribucion = models.ForeignKey('DistribucionFinal', on_delete=models.CASCADE, related_name='letras')
    empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, null=True, blank=True, related_name='letras')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField()
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    # Nuevos campos
    fecha_vencimiento_gracia = models.DateField(blank=True, null=True, 
                                              help_text="Fecha límite considerando el período de gracia")
    dias_retraso = models.IntegerField(default=0)
    interes_acumulado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_pago_real = models.DateField(null=True, blank=True)
    banco = models.CharField(max_length=100, blank=True)
    numero_operacion = models.CharField(max_length=50, blank=True)
    notas = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="letras_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="letras_updated", blank=True)

    class Meta:
        ordering = ['fecha_pago']
        verbose_name = "Letra"
        verbose_name_plural = "Letras"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['fecha_pago']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_vencimiento_gracia']),
        ]

    def save(self, *args, **kwargs):
        # Asignar empresa y pedido desde distribución
        if self.distribucion:
            self.empresa = self.distribucion.empresa
            self.pedido = self.distribucion.pedido
            
            # Calcular fecha de vencimiento con gracia (9 días hábiles)
            # Esto es una implementación básica que deberá ser refinada para considerar feriados
            if not self.fecha_vencimiento_gracia and self.fecha_pago:
                dias_habiles = 0
                fecha_actual = self.fecha_pago
                while dias_habiles < 9:
                    fecha_actual += timezone.timedelta(days=1)
                    # No contar fines de semana (0=lunes, 6=domingo)
                    if fecha_actual.weekday() < 5:  # Solo días de semana
                        dias_habiles += 1
                self.fecha_vencimiento_gracia = fecha_actual
                
        super().save(*args, **kwargs)
        
        # Actualizar montos de la distribución
        if self.distribucion:
            self.distribucion.calcular_montos()
            
        # Si se marca como pagada, actualizar el pedido
        if self.estado == 'pagado' and self.pedido:
            self.pedido.calcular_monto_pagado()

    def __str__(self):
        numero = self.numero_unico if self.numero_unico else 'Sin número'
        empresa = self.empresa.nombre if self.empresa else 'Sin empresa'
        proveedor = 'Sin proveedor'

        try:
            if self.pedido and self.pedido.proveedor:
                proveedor = self.pedido.proveedor.nombre
        except:
            pass

        return f"{numero} - {empresa} - {proveedor} - S/ {self.monto}"

class GuiaDeRemision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='guias_remision')
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='guias_remision')
    numero_guia = models.CharField(max_length=50, unique=True)
    fecha_emision = models.DateField()
    # Nuevos campos
    fecha_recepcion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, default='emitida', 
                            choices=[('emitida', 'Emitida'), ('en_transito', 'En Tránsito'), 
                                     ('recibida', 'Recibida'), ('anulada', 'Anulada')])
    transportista = models.CharField(max_length=100, blank=True)
    notas = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="guias_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="guias_updated", blank=True)

    class Meta:
        ordering = ["-fecha_emision"]
        verbose_name = "Guía de Remisión"
        verbose_name_plural = "Guías de Remisión"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['fecha_emision']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"Guía {self.numero_guia} ({self.empresa.nombre})"

class Factura(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guia_remision = models.ForeignKey(GuiaDeRemision, on_delete=models.CASCADE, related_name='facturas')
    numero_factura = models.CharField(max_length=50, unique=True)
    monto_factura = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_emision = models.DateField()
    # Nuevos campos
    fecha_vencimiento = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, default='emitida',
                           choices=[('emitida', 'Emitida'), ('pagada', 'Pagada'), 
                                    ('anulada', 'Anulada'), ('vencida', 'Vencida')])
    condicion_pago = models.CharField(max_length=50, blank=True, 
                                     help_text="Ej: Contado, Crédito 30 días, etc.")
    notas = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="facturas_created", blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="facturas_updated", blank=True)

    class Meta:
        ordering = ["-fecha_emision"]
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        # Índices para optimizar consultas
        indexes = [
            models.Index(fields=['fecha_emision']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_vencimiento']),
        ]

    def __str__(self):
        return f"Factura {self.numero_factura} ({self.guia_remision.empresa.nombre})"
