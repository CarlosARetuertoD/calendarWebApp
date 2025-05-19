# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calendarBackend', '0006_rename_monto_total_pedido_monto_total_pedido'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='monto_final_pedido',
            field=models.DecimalField(
                blank=True, 
                decimal_places=2, 
                help_text='Monto final real del pedido después de completarlo', 
                max_digits=12, 
                null=True
            ),
        ),
    ] 