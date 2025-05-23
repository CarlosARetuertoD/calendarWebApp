# Generated by Django 5.2 on 2025-05-18 09:08

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Empresa',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, unique=True)),
                ('ruc', models.CharField(max_length=11, unique=True)),
                ('direccion', models.CharField(blank=True, max_length=200)),
                ('telefono', models.CharField(blank=True, max_length=20)),
                ('email_contacto', models.EmailField(blank=True, max_length=254)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='empresas_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='empresas_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Empresa',
                'verbose_name_plural': 'Empresas',
            },
        ),
        migrations.CreateModel(
            name='DistribucionFinal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('monto_final', models.DecimalField(decimal_places=2, max_digits=12)),
                ('monto_en_letras', models.DecimalField(decimal_places=2, default=0, help_text='Monto asignado en letras (se actualiza automáticamente)', max_digits=12)),
                ('monto_disponible', models.DecimalField(blank=True, decimal_places=2, help_text='Monto disponible para asignar en letras', max_digits=12, null=True)),
                ('completado', models.BooleanField(default=False)),
                ('fecha_distribucion', models.DateField(auto_now_add=True)),
                ('notas', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='distribuciones_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='distribuciones_updated', to=settings.AUTH_USER_MODEL)),
                ('empresa', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='distribuciones', to='calendarBackend.empresa')),
            ],
            options={
                'verbose_name': 'Distribución Final',
                'verbose_name_plural': 'Distribuciones Finales',
            },
        ),
        migrations.CreateModel(
            name='GuiaDeRemision',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('numero_guia', models.CharField(max_length=50, unique=True)),
                ('fecha_emision', models.DateField()),
                ('fecha_recepcion', models.DateField(blank=True, null=True)),
                ('estado', models.CharField(choices=[('emitida', 'Emitida'), ('en_transito', 'En Tránsito'), ('recibida', 'Recibida'), ('anulada', 'Anulada')], default='emitida', max_length=20)),
                ('transportista', models.CharField(blank=True, max_length=100)),
                ('notas', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='guias_created', to=settings.AUTH_USER_MODEL)),
                ('empresa', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='guias_remision', to='calendarBackend.empresa')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='guias_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Guía de Remisión',
                'verbose_name_plural': 'Guías de Remisión',
                'ordering': ['-fecha_emision'],
            },
        ),
        migrations.CreateModel(
            name='Factura',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('numero_factura', models.CharField(max_length=50, unique=True)),
                ('monto_factura', models.DecimalField(decimal_places=2, max_digits=10)),
                ('fecha_emision', models.DateField()),
                ('fecha_vencimiento', models.DateField(blank=True, null=True)),
                ('estado', models.CharField(choices=[('emitida', 'Emitida'), ('pagada', 'Pagada'), ('anulada', 'Anulada'), ('vencida', 'Vencida')], default='emitida', max_length=20)),
                ('condicion_pago', models.CharField(blank=True, help_text='Ej: Contado, Crédito 30 días, etc.', max_length=50)),
                ('notas', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='facturas_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='facturas_updated', to=settings.AUTH_USER_MODEL)),
                ('guia_remision', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='facturas', to='calendarBackend.guiaderemision')),
            ],
            options={
                'verbose_name': 'Factura',
                'verbose_name_plural': 'Facturas',
                'ordering': ['-fecha_emision'],
            },
        ),
        migrations.CreateModel(
            name='Pedido',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('monto_total', models.DecimalField(decimal_places=2, max_digits=12)),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('asignado', 'Asignado'), ('completado', 'Completado'), ('cancelado', 'Cancelado')], default='pendiente', max_length=15)),
                ('fecha_pedido', models.DateField()),
                ('plazo_dias', models.IntegerField(default=60)),
                ('fecha_aprobacion', models.DateField(blank=True, null=True)),
                ('fecha_estimada_entrega', models.DateField(blank=True, null=True)),
                ('notas_internas', models.TextField(blank=True)),
                ('completado', models.BooleanField(default=False)),
                ('monto_pagado', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('numero_pedido', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pedidos_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pedidos_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Pedido',
                'verbose_name_plural': 'Pedidos',
                'ordering': ['-fecha_pedido'],
            },
        ),
        migrations.CreateModel(
            name='Letra',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('numero_unico', models.CharField(blank=True, max_length=20, null=True, unique=True)),
                ('monto', models.DecimalField(decimal_places=2, max_digits=10)),
                ('fecha_pago', models.DateField()),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('pagado', 'Pagado'), ('atrasado', 'Atrasado')], default='pendiente', max_length=10)),
                ('fecha_vencimiento_gracia', models.DateField(blank=True, help_text='Fecha límite considerando el período de gracia', null=True)),
                ('dias_retraso', models.IntegerField(default=0)),
                ('interes_acumulado', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('fecha_pago_real', models.DateField(blank=True, null=True)),
                ('banco', models.CharField(blank=True, max_length=100)),
                ('numero_operacion', models.CharField(blank=True, max_length=50)),
                ('notas', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='letras_created', to=settings.AUTH_USER_MODEL)),
                ('distribucion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='letras', to='calendarBackend.distribucionfinal')),
                ('empresa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='letras', to='calendarBackend.empresa')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='letras_updated', to=settings.AUTH_USER_MODEL)),
                ('pedido', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='letras', to='calendarBackend.pedido')),
            ],
            options={
                'verbose_name': 'Letra',
                'verbose_name_plural': 'Letras',
                'ordering': ['fecha_pago'],
            },
        ),
        migrations.AddField(
            model_name='guiaderemision',
            name='pedido',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='guias_remision', to='calendarBackend.pedido'),
        ),
        migrations.AddField(
            model_name='distribucionfinal',
            name='pedido',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='distribuciones_finales', to='calendarBackend.pedido'),
        ),
        migrations.CreateModel(
            name='Proveedor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100)),
                ('color', models.CharField(default='#1976d2', help_text='Código HEX del color (ej: #1976d2)', max_length=7)),
                ('ruc', models.CharField(blank=True, max_length=11, null=True)),
                ('direccion', models.CharField(blank=True, max_length=200)),
                ('telefono', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('plazo_credito_default', models.IntegerField(default=60, help_text='Plazo de crédito en días')),
                ('activo', models.BooleanField(default=True)),
                ('notas', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='proveedores_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='proveedores_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Proveedor',
                'verbose_name_plural': 'Proveedores',
            },
        ),
        migrations.AddField(
            model_name='pedido',
            name='proveedor',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='pedidos', to='calendarBackend.proveedor'),
        ),
        migrations.CreateModel(
            name='Vendedor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100)),
                ('telefono', models.CharField(max_length=20)),
                ('contacto_opcional', models.CharField(blank=True, max_length=100, null=True)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('notas', models.TextField(blank=True)),
                ('activo', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vendedores_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vendedores_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Vendedor',
                'verbose_name_plural': 'Vendedores',
            },
        ),
        migrations.AddField(
            model_name='proveedor',
            name='vendedor',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='calendarBackend.vendedor'),
        ),
        migrations.AddIndex(
            model_name='empresa',
            index=models.Index(fields=['nombre'], name='calendarBac_nombre_38ca12_idx'),
        ),
        migrations.AddIndex(
            model_name='empresa',
            index=models.Index(fields=['ruc'], name='calendarBac_ruc_ac5eef_idx'),
        ),
        migrations.AddIndex(
            model_name='factura',
            index=models.Index(fields=['fecha_emision'], name='calendarBac_fecha_e_b24f16_idx'),
        ),
        migrations.AddIndex(
            model_name='factura',
            index=models.Index(fields=['estado'], name='calendarBac_estado_229fb0_idx'),
        ),
        migrations.AddIndex(
            model_name='factura',
            index=models.Index(fields=['fecha_vencimiento'], name='calendarBac_fecha_v_8c98f6_idx'),
        ),
        migrations.AddIndex(
            model_name='letra',
            index=models.Index(fields=['fecha_pago'], name='calendarBac_fecha_p_a86ee9_idx'),
        ),
        migrations.AddIndex(
            model_name='letra',
            index=models.Index(fields=['estado'], name='calendarBac_estado_5dd02c_idx'),
        ),
        migrations.AddIndex(
            model_name='letra',
            index=models.Index(fields=['fecha_vencimiento_gracia'], name='calendarBac_fecha_v_feb31e_idx'),
        ),
        migrations.AddIndex(
            model_name='guiaderemision',
            index=models.Index(fields=['fecha_emision'], name='calendarBac_fecha_e_322adc_idx'),
        ),
        migrations.AddIndex(
            model_name='guiaderemision',
            index=models.Index(fields=['estado'], name='calendarBac_estado_43f592_idx'),
        ),
        migrations.AddIndex(
            model_name='distribucionfinal',
            index=models.Index(fields=['completado'], name='calendarBac_complet_c541f6_idx'),
        ),
        migrations.AddIndex(
            model_name='distribucionfinal',
            index=models.Index(fields=['fecha_distribucion'], name='calendarBac_fecha_d_d8419f_idx'),
        ),
        migrations.AddIndex(
            model_name='pedido',
            index=models.Index(fields=['estado'], name='calendarBac_estado_8857d3_idx'),
        ),
        migrations.AddIndex(
            model_name='pedido',
            index=models.Index(fields=['fecha_pedido'], name='calendarBac_fecha_p_52b975_idx'),
        ),
        migrations.AddIndex(
            model_name='pedido',
            index=models.Index(fields=['completado'], name='calendarBac_complet_2aa098_idx'),
        ),
        migrations.AddIndex(
            model_name='vendedor',
            index=models.Index(fields=['nombre'], name='calendarBac_nombre_692db0_idx'),
        ),
        migrations.AddIndex(
            model_name='vendedor',
            index=models.Index(fields=['activo'], name='calendarBac_activo_4c192c_idx'),
        ),
        migrations.AddIndex(
            model_name='proveedor',
            index=models.Index(fields=['nombre'], name='calendarBac_nombre_ba5eca_idx'),
        ),
        migrations.AddIndex(
            model_name='proveedor',
            index=models.Index(fields=['activo'], name='calendarBac_activo_a8b93a_idx'),
        ),
        migrations.AddIndex(
            model_name='proveedor',
            index=models.Index(fields=['ruc'], name='calendarBac_ruc_3fd59e_idx'),
        ),
    ]
