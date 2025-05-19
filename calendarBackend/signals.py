from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import GuiaDeRemision, Factura, DistribucionFinal, Letra

@receiver(post_save, sender=GuiaDeRemision)
def actualizar_empresa_en_facturas(sender, instance, **kwargs):
    for factura in instance.facturas.all():
        if factura.empresa != instance.empresa:
            factura.empresa = instance.empresa
            factura.save()

@receiver(post_save, sender=DistribucionFinal)
def actualizar_empresa_en_letras(sender, instance, **kwargs):
    for letra in instance.letras.all():
        actual_empresa = instance.empresa
        actual_pedido = instance.pedido
        cambios = False

        if letra.empresa != actual_empresa:
            letra.empresa = actual_empresa
            cambios = True

        if letra.pedido != actual_pedido:
            letra.distribucion = instance  # Esto ya lo tiene, pero puedes forzarlo si fuera necesario
            cambios = True

        if cambios:
            letra.save()
