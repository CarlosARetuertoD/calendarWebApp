from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class PerfilUsuario(models.Model):
    """
    Modelo de perfil de usuario que extiende el modelo User de Django
    para añadir información adicional y roles específicos.
    """
    ROLES = [
        ('superadmin', 'Super Administrador'),
        ('admin', 'Administrador'),
        ('lectura', 'Solo Lectura'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=15, choices=ROLES, default='lectura')
    telefono = models.CharField(max_length=20, blank=True)
    notas = models.TextField(blank=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    
    # Configuración de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuario"
        permissions = [
            ("view_dashboard", "Puede ver el dashboard"),
            ("export_reports", "Puede exportar reportes"),
        ]
    
    def __str__(self):
        return f"{self.user.username} ({self.get_rol_display()})"
    
    @property
    def nombre_completo(self):
        return f"{self.user.first_name} {self.user.last_name}"
    
    @property
    def es_superadmin(self):
        # Considerar superadmin tanto por rol como por is_superuser de Django
        return self.rol == 'superadmin' or self.user.is_superuser
    
    @property
    def es_admin(self):
        # Considerar admin por rol, is_staff o is_superuser de Django
        return self.rol in ['superadmin', 'admin'] or self.user.is_staff or self.user.is_superuser
    
    @property
    def es_lectura(self):
        # Solo es lectura si no es admin ni superadmin
        return not self.es_admin

# Las señales están comentadas para evitar conflictos con el admin
'''
@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        PerfilUsuario.objects.create(user=instance)

@receiver(post_save, sender=User)
def guardar_perfil_usuario(sender, instance, created, **kwargs):
    """
    Guardar el perfil del usuario después de guardar el modelo User
    Solo guarda el perfil si no es una creación nueva (para evitar duplicados)
    y si el perfil ya existe
    """
    if not created:
        # Solo actualizar el perfil si ya existe para evitar errores de integridad
        if hasattr(instance, 'perfil'):
            instance.perfil.save()
'''

class RegistroAcceso(models.Model):
    """
    Registro de accesos al sistema para auditoría
    """
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accesos')
    fecha_acceso = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    exitoso = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Registro de Acceso"
        verbose_name_plural = "Registros de Acceso"
        ordering = ['-fecha_acceso']
    
    def __str__(self):
        estado = "exitoso" if self.exitoso else "fallido"
        return f"Acceso {estado} de {self.usuario.username} el {self.fecha_acceso:%d/%m/%Y %H:%M}"
