from django.contrib import admin
from .models import UserActivity, RolPersonalizado, SystemBackup

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action_type', 'entity_type', 'entity_id', 'timestamp', 'ip_address')
    list_filter = ('action_type', 'entity_type', 'timestamp', 'user')
    search_fields = ('user__username', 'entity_type', 'entity_id', 'description')
    readonly_fields = ('user', 'action_type', 'entity_type', 'entity_id', 'description', 
                      'timestamp', 'ip_address', 'user_agent')
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

@admin.register(RolPersonalizado)
class RolPersonalizadoAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_by', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    filter_horizontal = ('permissions',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(SystemBackup)
class SystemBackupAdmin(admin.ModelAdmin):
    list_display = ('name', 'backup_type', 'status', 'created_by', 'created_at', 'completed_at', 'size_bytes')
    list_filter = ('backup_type', 'status', 'created_at')
    search_fields = ('name', 'notes')
    readonly_fields = ('file_path', 'created_at', 'completed_at', 'size_bytes', 'status')
    date_hierarchy = 'created_at'
    
    def has_change_permission(self, request, obj=None):
        # No permitir cambios en respaldos completados o fallidos
        if obj and obj.status in ['completed', 'failed']:
            return False
        return True
