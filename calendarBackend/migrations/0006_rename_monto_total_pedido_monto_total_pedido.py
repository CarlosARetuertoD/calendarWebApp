# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('calendarBackend', '0005_pedido_es_contado'),
    ]

    operations = [
        migrations.RenameField(
            model_name='pedido',
            old_name='monto_total',
            new_name='monto_total_pedido',
        ),
    ] 