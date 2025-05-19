from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db import transaction
from django.contrib.auth.forms import UserCreationForm
from django import forms
from .models import PerfilUsuario, RegistroAcceso

# Formulario personalizado para crear usuarios con contraseñas simples
class CustomUserCreationForm(UserCreationForm):
    rol = forms.ChoiceField(choices=PerfilUsuario.ROLES, required=True, label="Rol")
    password1 = forms.CharField(
        label="Contraseña",
        strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        help_text="Ingresa una contraseña simple, no hay restricciones.",
        required=False,
    )
    password2 = forms.CharField(
        label="Confirmar contraseña",
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        help_text="Repite la misma contraseña para verificar.",
        required=False,
    )
    
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser')
        
    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Las contraseñas no coinciden")
        return password2
        
    def save(self, commit=True):
        user = super(UserCreationForm, self).save(commit=False)
        password = self.cleaned_data.get("password1")
        if password:
            user.set_password(password)
        else:
            # Si no hay contraseña, dejamos la predeterminada (la que Django asigna automáticamente)
            pass
        if commit:
            user.save()
        return user

# Configuración para mostrar el perfil inline en el admin de usuario
class PerfilUsuarioInline(admin.StackedInline):
    model = PerfilUsuario
    can_delete = False
    verbose_name_plural = 'Perfil'
    fk_name = 'user'

# Extender el admin de User para incluir el perfil
class UserAdmin(BaseUserAdmin):
    inlines = (PerfilUsuarioInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_rol', 'is_active', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2', 'is_staff', 'is_superuser', 'rol'),
        }),
    )
    
    def get_rol(self, obj):
        try:
            return obj.perfil.get_rol_display()
        except:
            return "-"
    get_rol.short_description = 'Rol'
    
    def add_view(self, request, form_url='', extra_context=None):
        """Vista personalizada para añadir usuarios"""
        self.inlines = []  # Desactivar inlines en la vista de añadir
        return super().add_view(request, form_url, extra_context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Vista personalizada para editar usuarios"""
        self.inlines = [PerfilUsuarioInline]  # Activar inlines en la vista de editar
        return super().change_view(request, object_id, form_url, extra_context)
    
    @transaction.atomic
    def save_model(self, request, obj, form, change):
        """Guardar el usuario y su perfil"""
        if not change:  # Creación de usuario
            # Obtener el rol del formulario
            rol = form.cleaned_data.get('rol', 'lectura')
            obj.save()
            
            # Crear perfil
            PerfilUsuario.objects.create(user=obj, rol=rol)
        else:
            # Actualización de usuario
            obj.save()

# Re-registrar el modelo User con nuestra configuración personalizada
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(RegistroAcceso)
class RegistroAccesoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'fecha_acceso', 'ip_address', 'exitoso')
    list_filter = ('exitoso', 'fecha_acceso')
    search_fields = ('usuario__username', 'ip_address')
    readonly_fields = ('usuario', 'fecha_acceso', 'ip_address', 'user_agent', 'exitoso')
    
    def has_add_permission(self, request):
        # No permitir añadir registros manualmente
        return False
    
    def has_change_permission(self, request, obj=None):
        # No permitir editar registros
        return False
