from django.contrib import admin
from django.db import models
from django.forms import TextInput
from django.utils.html import format_html
from django import forms
from django.http import JsonResponse
from django.urls import path
from django.utils.safestring import mark_safe

from .models import Empresa, Vendedor, Proveedor, Pedido, DistribucionFinal, Letra, GuiaDeRemision, Factura

# 🟡 Formulario personalizado para el campo color en Proveedor
class ProveedorForm(forms.ModelForm):
    class Meta:
        model = Proveedor
        fields = '__all__'
        widgets = {
            'color': TextInput(attrs={'type': 'color'})
        }

# ✅ Admin Empresa
@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ruc')
    search_fields = ('nombre', 'ruc')

# ✅ Admin Vendedor
@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'telefono', 'contacto_opcional')
    search_fields = ('nombre', 'telefono', 'contacto_opcional')

# ✅ Admin Proveedor
@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    form = ProveedorForm
    list_display = ('nombre', 'vendedor', 'color_preview')
    search_fields = ('nombre', 'vendedor__nombre')

    def color_preview(self, obj):
        return format_html('<div style="width: 30px; height: 20px; background: {}; border: 1px solid #ccc;"></div>', obj.color)
    color_preview.short_description = "Color"

# ✅ Inline para Distribución
class DistribucionInline(admin.TabularInline):
    model = DistribucionFinal
    extra = 1

# ✅ Inline para Guía
class GuiaDeRemisionInline(admin.TabularInline):
    model = GuiaDeRemision
    extra = 1

# ✅ Admin Pedido
@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('proveedor', 'monto_total_pedido', 'estado', 'fecha_pedido')
    list_filter = ('estado', 'fecha_pedido')
    search_fields = ('proveedor__nombre',)

from django.core.exceptions import ValidationError
from django.db.models import Sum

# Formulario para Letra con validaciones
class LetraForm(forms.ModelForm):
    class Meta:
        model = Letra
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Personalizamos el queryset y cómo se ven las opciones del select
        self.fields['distribucion'].queryset = DistribucionFinal.objects.select_related('empresa', 'pedido__proveedor')
        self.fields['distribucion'].label_from_instance = self.label_from_instance
        self.fields['distribucion'].label = "Selecciona una Distribución Final"
        self.fields['distribucion'].help_text = "La empresa y el pedido se asignarán automáticamente."

    def label_from_instance(self, obj):
        return (
            f"📦 Empresa: {obj.empresa.nombre} | 🧾 Pedido: {obj.pedido.proveedor.nombre} "
            f"| 💰 Monto: S/ {obj.monto_final:,.2f}"
        )

    def clean(self):
        cleaned_data = super().clean()
        distribucion = cleaned_data.get('distribucion')
        monto = cleaned_data.get('monto')

        if distribucion and monto:
            letras_existentes = distribucion.letras.exclude(id=self.instance.id)
            total_existente = letras_existentes.aggregate(total=Sum('monto'))['total'] or 0
            disponible = distribucion.monto_final - total_existente

            if monto > disponible:
                raise ValidationError(
                    f"⚠️ El monto ingresado ({monto}) supera el disponible ({disponible:.2f}) en la distribución."
                )
        
        return cleaned_data

# Admin para Letra
@admin.register(Letra)
class LetraAdmin(admin.ModelAdmin):
    form = LetraForm
    list_display = ('numero_unico', 'get_empresa', 'monto', 'fecha_pago', 'estado')
    list_filter = ('estado', 'fecha_pago')
    search_fields = ('numero_unico',)
    readonly_fields = ('empresa', 'pedido')
    exclude = ()  # Asegúrate de no excluir empresa y pedido si quieres que aparezcan como solo lectura

    def get_empresa(self, obj):
        return obj.empresa.nombre if obj.empresa else "-"
    get_empresa.short_description = "Empresa"

# Admin para Guía de Remisión
@admin.register(GuiaDeRemision)
class GuiaDeRemisionAdmin(admin.ModelAdmin):
    list_display = ('numero_guia', 'pedido', 'empresa', 'fecha_emision')
    search_fields = ('numero_guia', 'empresa__nombre', 'pedido__proveedor__nombre')

# Admin para Factura
@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('numero_factura', 'guia_remision', 'empresa', 'monto_factura', 'fecha_emision')
    search_fields = ('numero_factura', 'guia_remision__numero_guia')
    readonly_fields = ('empresa',)

    def empresa(self, obj):
        return obj.guia_remision.empresa
    empresa.short_description = "Empresa"

    def save_model(self, request, obj, form, change):
        obj.empresa = obj.guia_remision.empresa
        super().save_model(request, obj, form, change)

# ✅ Admin Distribución
@admin.register(DistribucionFinal)
class DistribucionAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'empresa', 'monto_final')
    list_filter = ('empresa',)
    search_fields = ('pedido__proveedor__nombre', 'empresa__nombre')
