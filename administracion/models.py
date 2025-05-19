from django.db import models
from django.contrib.auth.models import User, Group, Permission
from django.utils import timezone

# Create your models here.

class UserActivity(models.Model):
    """
    Modelo para registrar actividades importantes de los usuarios
    en el sistema, como crear/modificar registros o hacer cambios
    en la configuración
    """
    ACTION_TYPES = [
        ('login', 'Inicio de sesión'),
        ('logout', 'Cierre de sesión'),
        ('create', 'Creación'),
        ('update', 'Actualización'),
        ('delete', 'Eliminación'),
        ('view', 'Visualización'),
        ('permission_change', 'Cambio de permisos'),
        ('other', 'Otra acción'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    entity_type = models.CharField(max_length=50, help_text="Tipo de entidad afectada (ej: Usuario, Letra, etc.)")
    entity_id = models.CharField(max_length=50, null=True, blank=True, help_text="ID de la entidad afectada")
    description = models.TextField(help_text="Descripción detallada de la acción")
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Actividad de Usuario"
        verbose_name_plural = "Actividades de Usuarios"
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_action_type_display()} - {self.timestamp}"

class RolPersonalizado(models.Model):
    """
    Modelo para crear roles personalizados más allá de los grupos
    estándar de Django, con descripciones y metadatos adicionales
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='roles_created')
    
    class Meta:
        verbose_name = "Rol Personalizado"
        verbose_name_plural = "Roles Personalizados"
    
    def __str__(self):
        return self.name

class SystemBackup(models.Model):
    """
    Modelo para registrar y gestionar los respaldos del sistema
    
    Este modelo almacena la información de los respaldos de la base de datos
    y/o archivos media. El proceso de respaldo varía según el motor de base
    de datos utilizado:
    
    - SQLite (desarrollo local): 
      * Respaldo simple mediante volcado SQL
      * Archivos almacenados localmente
      * Ideal para desarrollo y pruebas
    
    - PostgreSQL (producción en Render):
      * Utiliza pg_dump para respaldos
      * Requiere configuración adicional en producción
      * Considerar almacenamiento persistente en la nube
    
    El campo 'carpeta' permite especificar dónde se guardarán los archivos:
    - Vacío: usa la carpeta predeterminada ('backups/')
    - 'media/respaldos': almacena en carpeta media (accesible vía web)
    - Ruta personalizada: cualquier ruta dentro del proyecto
    
    IMPORTANTE PARA POSTGRESQL EN RENDER:
    La carpeta 'media/' en Render es persistente entre despliegues pero no
    entre instancias. Para respaldos permanentes en producción, considere
    integrar con servicios como S3, Dropbox o Google Drive.
    """
    BACKUP_TYPES = [
        ('full', 'Completo'),
        ('data', 'Solo datos'),
        ('media', 'Solo archivos'),
    ]
    
    BACKUP_STATUS = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En progreso'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    name = models.CharField(max_length=100)
    backup_type = models.CharField(max_length=10, choices=BACKUP_TYPES)
    status = models.CharField(max_length=20, choices=BACKUP_STATUS, default='pending')
    file_path = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='backups_created')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    carpeta = models.CharField(max_length=255, blank=True, null=True, 
                             help_text="Carpeta personalizada para el respaldo. Si está vacía, se usará la predeterminada.")
    
    class Meta:
        verbose_name = "Respaldo del Sistema"
        verbose_name_plural = "Respaldos del Sistema"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_backup_type_display()}) - {self.created_at.strftime('%d/%m/%Y %H:%M')}"
