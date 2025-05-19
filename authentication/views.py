from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from .models import PerfilUsuario, RegistroAcceso
from .serializers import (
    UserSerializer, 
    UserLightSerializer,
    LoginSerializer, 
    ChangePasswordSerializer
)

# Permisos personalizados
class IsSuperAdmin(permissions.BasePermission):
    """Permiso que solo permite acceso a superadmins"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            print(f"IsSuperAdmin: Usuario no autenticado")
            return False
        
        # Primero comprobar si es superusuario de Django directamente
        if request.user.is_superuser and request.user.is_staff:
            print(f"IsSuperAdmin: {request.user.username} es superusuario de Django")
            return True
            
        # Luego comprobar el perfil
        try:
            # Forzar una recarga del perfil de usuario para asegurar que estamos usando datos actuales
            # Esto evita problemas de caché que puedan causar que los roles no se reflejen correctamente
            if hasattr(request.user, 'perfil'):
                perfil = PerfilUsuario.objects.select_for_update().get(user=request.user)
                es_superadmin = perfil.es_superadmin
            else:
                es_superadmin = False
                
            print(f"IsSuperAdmin: {request.user.username} tiene perfil con rol superadmin: {es_superadmin}")
            
            # Si se detecta que el usuario debería ser superadmin pero hay inconsistencia de datos, corregir
            if request.user.is_superuser and not es_superadmin and hasattr(request.user, 'perfil'):
                print(f"Corrigiendo inconsistencia: {request.user.username} es superusuario pero no tiene rol superadmin")
                perfil.rol = 'superadmin'
                perfil.save(update_fields=['rol'])
                es_superadmin = True
                
            return es_superadmin
        except Exception as e:
            print(f"IsSuperAdmin: Error al verificar permisos: {str(e)}")
            # En caso de error, permitir acceso si es superusuario de Django
            return request.user.is_superuser and request.user.is_staff

class IsAdminUser(permissions.BasePermission):
    """Permiso que permite acceso a admins y superadmins"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            print(f"IsAdminUser: Usuario no autenticado")
            return False
        
        # Primero comprobar si es admin o superusuario de Django directamente
        if request.user.is_staff:
            print(f"IsAdminUser: {request.user.username} es staff de Django")
            return True
            
        # Luego comprobar el perfil
        try:
            es_admin = hasattr(request.user, 'perfil') and request.user.perfil.es_admin
            print(f"IsAdminUser: {request.user.username} tiene perfil con rol admin: {es_admin}")
            return es_admin
        except Exception as e:
            print(f"IsAdminUser: Error al verificar permisos: {str(e)}")
            # En caso de error, permitir acceso si es staff de Django
            return request.user.is_staff

# Vista de login
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            
            if user:
                # Registrar acceso exitoso
                RegistroAcceso.objects.create(
                    usuario=user,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    exitoso=True
                )
                
                # Actualizar último acceso
                user.perfil.ultimo_acceso = timezone.now()
                user.perfil.save()
                
                # Iniciar sesión
                login(request, user)
                
                # Crear o recuperar token
                token, created = Token.objects.get_or_create(user=user)
                
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data,
                    'message': 'Inicio de sesión exitoso'
                })
            else:
                # Registrar intento fallido si el usuario existe
                user_obj = User.objects.filter(username=username).first()
                if user_obj:
                    RegistroAcceso.objects.create(
                        usuario=user_obj,
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        exitoso=False
                    )
                
                return Response({
                    'error': 'Credenciales inválidas'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

# Vista de logout
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Eliminar token
        Token.objects.filter(user=request.user).delete()
        
        # Cerrar sesión
        logout(request)
        
        return Response({
            'message': 'Sesión cerrada correctamente'
        })

# Vista para cambiar contraseña
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Si es admin o superadmin y está cambiando la contraseña de otro usuario
            # no se requiere verificar la contraseña antigua
            es_admin = request.user.perfil.es_admin or request.user.perfil.es_superadmin
            usuario_id = request.data.get('user_id')
            
            if es_admin and usuario_id and str(request.user.id) != usuario_id:
                # Administrador cambiando contraseña de otro usuario
                try:
                    user = User.objects.get(id=usuario_id)
                    user.set_password(serializer.data.get('new_password'))
                    user.save()
                    
                    return Response({
                        'message': f'Contraseña de {user.username} actualizada correctamente'
                    })
                except User.DoesNotExist:
                    return Response({
                        'error': 'Usuario no encontrado'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                # Usuario cambiando su propia contraseña
                # Comprobar contraseña antigua
                if not request.user.check_password(serializer.data.get('old_password')):
                    return Response({
                        'error': 'La contraseña actual es incorrecta'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Establecer nueva contraseña
                request.user.set_password(serializer.data.get('new_password'))
                request.user.save()
                
                # Actualizar token
                Token.objects.filter(user=request.user).delete()
                token = Token.objects.create(user=request.user)
                
                return Response({
                    'message': 'Contraseña actualizada correctamente',
                    'token': token.key
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ViewSet para usuarios
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        - Superadmin puede hacer todo
        - Admin puede listar y ver detalles
        - Admin puede editar su propio perfil
        - Para crear, eliminar o cambiar rol: solo superadmin
        """
        if self.action in ['create', 'destroy']:
            permission_classes = [IsSuperAdmin]
        elif self.action in ['update', 'partial_update']:
            # Si es admin solo puede editar su perfil, superadmin puede editar cualquiera
            if self.request.user.perfil.es_superadmin:
                permission_classes = [IsSuperAdmin]
            else:
                permission_classes = [IsAdminUser]
        else:
            # Listar y detalles
            permission_classes = [IsAdminUser]
            
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserLightSerializer
        return UserSerializer
    
    def perform_update(self, serializer):
        # Admin solo puede editar su propio perfil
        if not self.request.user.perfil.es_superadmin:
            if self.request.user.id != self.get_object().id:
                self.permission_denied(self.request, message="No tienes permiso para editar otros usuarios")
        
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Devuelve información del usuario autenticado"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
