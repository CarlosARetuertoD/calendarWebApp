import uuid
from django.db import models
from django.utils import timezone

BENEFICIARIOS = [
    ('Pionier', 'Pionier'),
    ('Wrangler', 'Wrangler'),
    ('Norton', 'Norton'),
    ('Vowh', 'Vowh'),
    ('Metal', 'Metal'),
    ('Prestamo', 'Préstamo'),
]

class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('asignado', 'Asignado'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    beneficiario = models.CharField(max_length=20, choices=BENEFICIARIOS)
    monto_total = models.DecimalField(max_digits=12, decimal_places=2)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_pedido = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-fecha_pedido"]

    def __str__(self):
        return f"{self.beneficiario} - {self.monto_total} ({self.fecha_pedido:%d/%m/%Y})"

class Letra(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('atrasado', 'Atrasado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='letras')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField()
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Letra"
        verbose_name_plural = "Letras"
        ordering = ["fecha_pago"]

    def __str__(self):
        return f"{self.pedido.beneficiario} - {self.monto} ({self.fecha_pago:%d/%m/%Y})"

class GuiaDeRemision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='guias_remision')
    numero_guia = models.CharField(max_length=50, unique=True)
    fecha_emision = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Guía de Remisión"
        verbose_name_plural = "Guías de Remisión"
        ordering = ["-fecha_emision"]

    def __str__(self):
        return f"Guía {self.numero_guia} ({self.pedido.beneficiario})"

class Factura(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guia_remision = models.ForeignKey(GuiaDeRemision, on_delete=models.CASCADE, related_name='facturas')
    numero_factura = models.CharField(max_length=50, unique=True)
    monto_factura = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_emision = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ["-fecha_emision"]

    def __str__(self):
        return f"Factura {self.numero_factura} ({self.guia_remision.numero_guia})"
