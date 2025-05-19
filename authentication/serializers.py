from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PerfilUsuario
from django.db import transaction

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilUsuario
        fields = ('rol', 'telefono', 'ultimo_acceso')

class UserSerializer(serializers.ModelSerializer):
    perfil = PerfilUsuarioSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    rol = serializers.ChoiceField(choices=PerfilUsuario.ROLES, write_only=True, required=False)
    telefono = serializers.CharField(write_only=True, required=False)
    notas = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'is_active', 'date_joined', 'perfil', 'password', 'rol', 'telefono', 'notas')
        read_only_fields = ('date_joined',)
    
    @transaction.atomic
    def create(self, validated_data):
        rol = validated_data.pop('rol', 'lectura')
        password = validated_data.pop('password', None)
        telefono = validated_data.pop('telefono', '')
        notas = validated_data.pop('notas', '')
        
        # Crear usuario
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Si no se proporciona contraseña, establecer una contraseña vacía
            user.set_unusable_password()
        
        user.save()
        
        # Crear perfil manualmente (ya que no usamos signals)
        perfil, created = PerfilUsuario.objects.get_or_create(
            user=user,
            defaults={'rol': rol, 'telefono': telefono, 'notas': notas}
        )
        
        # Si el perfil ya existía, actualizamos sus datos
        if not created:
            perfil.rol = rol
            perfil.telefono = telefono
            perfil.notas = notas
            perfil.save()
        
        return user
    
    @transaction.atomic
    def update(self, instance, validated_data):
        rol = validated_data.pop('rol', None)
        password = validated_data.pop('password', None)
        telefono = validated_data.pop('telefono', None)
        notas = validated_data.pop('notas', None)
        
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Actualizar perfil
        perfil, created = PerfilUsuario.objects.get_or_create(
            user=instance,
            defaults={'rol': rol or 'lectura', 'telefono': telefono or '', 'notas': notas or ''}
        )
        
        # Si el perfil ya existía, actualizamos sus campos
        if not created:
            if rol is not None:
                perfil.rol = rol
            if telefono is not None:
                perfil.telefono = telefono
            if notas is not None:
                perfil.notas = notas
            perfil.save()
        
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False)
    new_password = serializers.CharField(required=True)
    user_id = serializers.IntegerField(required=False)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'}, trim_whitespace=False)

class UserLightSerializer(serializers.ModelSerializer):
    """Versión ligera del serializer para listado de usuarios"""
    rol = serializers.CharField(source='perfil.rol')
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'rol') 