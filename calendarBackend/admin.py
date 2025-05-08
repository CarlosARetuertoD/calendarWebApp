from django.contrib import admin
from .models import Pedido, Letra, GuiaDeRemision, Factura

class LetraInline(admin.TabularInline):
    model = Letra
    extra = 1

class GuiaDeRemisionInline(admin.TabularInline):
    model = GuiaDeRemision
    extra = 1

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('beneficiario', 'monto_total', 'estado', 'fecha_pedido')
    list_filter = ('estado', 'beneficiario', 'fecha_pedido')
    search_fields = ('beneficiario',)
    inlines = [LetraInline, GuiaDeRemisionInline]

@admin.register(Letra)
class LetraAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'monto', 'fecha_pago', 'estado')
    list_filter = ('estado', 'fecha_pago')
    search_fields = ('pedido__beneficiario',)

@admin.register(GuiaDeRemision)
class GuiaDeRemisionAdmin(admin.ModelAdmin):
    list_display = ('numero_guia', 'pedido', 'fecha_emision')
    search_fields = ('numero_guia', 'pedido__beneficiario')

@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('numero_factura', 'guia_remision', 'monto_factura', 'fecha_emision')
    search_fields = ('numero_factura', 'guia_remision__numero_guia')
