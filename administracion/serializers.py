from rest_framework import serializers
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.password_validation import validate_password
from django.contrib.contenttypes.models import ContentType
from authentication.models import PerfilUsuario
from .models import UserActivity, RolPersonalizado, SystemBackup

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilUsuario
        fields = ['rol', 'telefono', 'notas']

class UserListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar usuarios"""
    rol = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 
                  'is_active', 'is_staff', 'rol', 'date_joined', 'last_login']
    
    def get_rol(self, obj):
        try:
            return obj.perfil.get_rol_display()
        except:
            return "Sin rol asignado"

class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalles de usuario"""
    perfil = PerfilUsuarioSerializer(required=False)
    groups = GroupSerializer(many=True, read_only=True)
    group_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True,
        required=False
    )
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 
                 'email', 'is_active', 'is_staff', 'date_joined', 'last_login',
                 'perfil', 'groups', 'group_ids']
        read_only_fields = ['date_joined', 'last_login']
    
    def validate_password(self, value):
        if value:
            validate_password(value)
        return value
    
    def create(self, validated_data):
        # Extraer datos anidados
        perfil_data = validated_data.pop('perfil', {})
        group_ids = validated_data.pop('group_ids', [])
        password = validated_data.pop('password', None)
        
        # Crear usuario
        user = User.objects.create(**validated_data)
        
        # Establecer contraseña
        if password:
            user.set_password(password)
            user.save()
        
        # Crear perfil
        if perfil_data:
            PerfilUsuario.objects.create(user=user, **perfil_data)
        
        # Asignar grupos
        if group_ids:
            groups = Group.objects.filter(id__in=group_ids)
            user.groups.set(groups)
        
        return user
    
    def update(self, instance, validated_data):
        # Extraer datos anidados
        perfil_data = validated_data.pop('perfil', None)
        group_ids = validated_data.pop('group_ids', None)
        password = validated_data.pop('password', None)
        
        # Actualizar campos básicos del usuario
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Establecer contraseña si se proporciona
        if password:
            instance.set_password(password)
        
        # Guardar cambios en usuario
        instance.save()
        
        # Actualizar perfil si se proporciona
        if perfil_data is not None:
            perfil = getattr(instance, 'perfil', None)
            
            # Verificar cambios en el rol para mantener consistencia con flags de Django
            rol = perfil_data.get('rol', None)
            if rol == 'superadmin' and not instance.is_superuser:
                # Si el rol es superadmin, asegurarse que los flags de Django coincidan
                instance.is_superuser = True
                instance.is_staff = True
                instance.save(update_fields=['is_superuser', 'is_staff'])
            elif rol != 'superadmin' and instance.is_superuser:
                # Si el rol NO es superadmin pero tiene permisos de superusuario, quitarlos
                instance.is_superuser = False
                # Si el rol es admin, mantener is_staff=True, de lo contrario establecerlo a False
                instance.is_staff = rol == 'admin'
                instance.save(update_fields=['is_superuser', 'is_staff'])
                print(f"INFO: El usuario {instance.username} ahora tiene rol '{rol}' y sus permisos de Django han sido ajustados")
            
            if perfil:
                # Si ya existe un perfil, actualizarlo
                for attr, value in perfil_data.items():
                    setattr(perfil, attr, value)
                perfil.save()
            else:
                # Si no existe un perfil, crearlo
                PerfilUsuario.objects.create(user=instance, **perfil_data)
        
        # Actualizar grupos si se proporcionan
        if group_ids is not None:
            groups = Group.objects.filter(id__in=group_ids)
            instance.groups.set(groups)
        
        return instance

class PermissionSerializer(serializers.ModelSerializer):
    content_type_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type', 'content_type_name']
    
    def get_content_type_name(self, obj):
        return f"{obj.content_type.app_label}.{obj.content_type.model}"

class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        fields = ['id', 'app_label', 'model']

class RolPersonalizadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolPersonalizado
        fields = '__all__'

class UserActivitySerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    action_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActivity
        fields = '__all__'
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_action_type_display(self, obj):
        return obj.get_action_type_display()

class SystemBackupSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    backup_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemBackup
        fields = '__all__'
        read_only_fields = ['status', 'file_path', 'completed_at', 'size_bytes']
    
    def get_created_by_username(self, obj):
        if obj.created_by:
            return obj.created_by.username
        return None
    
    def get_backup_type_display(self, obj):
        return obj.get_backup_type_display()
    
    def get_status_display(self, obj):
        return obj.get_status_display()