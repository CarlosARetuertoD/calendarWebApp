from django.shortcuts import render
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse

import os
import subprocess
import threading
from pathlib import Path

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserActivity, RolPersonalizado, SystemBackup
from .serializers import (
    UserListSerializer, 
    UserDetailSerializer,
    GroupSerializer,
    PermissionSerializer,
    RolPersonalizadoSerializer,
    UserActivitySerializer,
    ContentTypeSerializer,
    SystemBackupSerializer
)

from authentication.views import IsSuperAdmin, IsAdminUser

# Utilidad para registrar actividad
def register_activity(request, action_type, entity_type, entity_id=None, description=""):
    """Registra una actividad de usuario en el sistema"""
    try:
        UserActivity.objects.create(
            user=request.user,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
    except Exception as e:
        # No queremos que un error en el registro de actividad interrumpa la operación principal
        print(f"Error al registrar actividad: {str(e)}")

def get_client_ip(request):
    """Obtiene la dirección IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class UserViewSet(viewsets.ModelViewSet):
    """
    API para gestionar usuarios
    """
    queryset = User.objects.all().order_by('-date_joined')
    filterset_fields = ['is_active', 'is_staff', 'date_joined']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            permission_classes = [IsSuperAdmin]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        # Para nuevos usuarios, siempre rol lectura desde API
        user_data = serializer.validated_data
        if 'perfil' in user_data:
            # Asegurar que el rol es 'lectura' al crear desde la API
            user_data['perfil']['rol'] = 'lectura'
        user = serializer.save()
        register_activity(
            self.request, 'create', 'Usuario', 
            str(user.id), f"Creación de usuario: {user.username}"
        )
    
    def perform_update(self, serializer):
        # Obtener el usuario antes de la actualización para comparar cambios
        user_id = self.get_object().id
        old_user = User.objects.select_related('perfil').get(id=user_id)
        old_data = {
            'username': old_user.username,
            'first_name': old_user.first_name or '',
            'last_name': old_user.last_name or '',
            'email': old_user.email or '',
            'is_active': old_user.is_active,
            'is_staff': old_user.is_staff,
            'is_superuser': old_user.is_superuser,
        }
        
        if hasattr(old_user, 'perfil'):
            old_data['perfil_rol'] = old_user.perfil.rol
            old_data['perfil_telefono'] = old_user.perfil.telefono or ''
            old_data['perfil_notas'] = old_user.perfil.notas or ''
            
            # Preservar el rol existente, ignorando cambios desde el frontend
            user_data = serializer.validated_data
            if 'perfil' in user_data:
                # Asegurar que el rol no cambia desde la API
                user_data['perfil']['rol'] = old_user.perfil.rol
        
        # Guardar los cambios
        user = serializer.save()
        
        # Obtener los datos actualizados
        updated_data = {
            'username': user.username,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'email': user.email or '',
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
        
        if hasattr(user, 'perfil'):
            updated_data['perfil_rol'] = user.perfil.rol
            updated_data['perfil_telefono'] = user.perfil.telefono or ''
            updated_data['perfil_notas'] = user.perfil.notas or ''
        
        # Determinar qué campos cambiaron
        changed_fields = []
        for key in updated_data:
            if key in old_data and updated_data[key] != old_data[key]:
                if key == 'perfil_rol':
                    # Mostrar cambios de rol con nombres amigables
                    roles_display = dict(PerfilUsuario.ROLES)
                    old_rol_display = roles_display.get(old_data[key], old_data[key])
                    new_rol_display = roles_display.get(updated_data[key], updated_data[key])
                    changed_fields.append(f"rol: {old_rol_display} → {new_rol_display}")
                else:
                    field_name = key.replace('perfil_', '') if key.startswith('perfil_') else key
                    changed_fields.append(f"{field_name}: {old_data[key]} → {updated_data[key]}")
        
        # Crear descripción detallada para el registro
        if changed_fields:
            change_description = f"Actualización de usuario: {user.username}. Cambios: {'; '.join(changed_fields)}"
        else:
            change_description = f"Actualización de usuario: {user.username} (sin cambios detectados)"
        
        register_activity(
            self.request, 'update', 'Usuario', 
            str(user.id), change_description
        )
    
    def perform_destroy(self, instance):
        username = instance.username
        register_activity(
            self.request, 'delete', 'Usuario', 
            str(instance.id), f"Eliminación de usuario: {username}"
        )
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Devuelve información del usuario autenticado"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

class GroupViewSet(viewsets.ModelViewSet):
    """
    API para gestionar grupos
    """
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    
    def get_permissions(self):
        permission_classes = [IsSuperAdmin]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        group = serializer.save()
        register_activity(
            self.request, 'create', 'Grupo', 
            str(group.id), f"Creación de grupo: {group.name}"
        )
    
    def perform_update(self, serializer):
        group = serializer.save()
        register_activity(
            self.request, 'update', 'Grupo', 
            str(group.id), f"Actualización de grupo: {group.name}"
        )
    
    def perform_destroy(self, instance):
        group_name = instance.name
        register_activity(
            self.request, 'delete', 'Grupo', 
            str(instance.id), f"Eliminación de grupo: {group_name}"
        )
        instance.delete()

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API para consultar permisos (solo lectura)
    """
    queryset = Permission.objects.all().select_related('content_type')
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        queryset = Permission.objects.all().select_related('content_type')
        
        # Filtrar por app_label si se proporciona
        app_label = self.request.query_params.get('app_label', None)
        if app_label:
            queryset = queryset.filter(content_type__app_label=app_label)
        
        # Filtrar por modelo si se proporciona
        model = self.request.query_params.get('model', None)
        if model:
            queryset = queryset.filter(content_type__model=model)
        
        # Búsqueda por nombre o codename
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(codename__icontains=search)
            )
        
        return queryset

class ContentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API para consultar tipos de contenido (solo lectura)
    """
    queryset = ContentType.objects.all()
    serializer_class = ContentTypeSerializer
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        queryset = ContentType.objects.all()
        
        # Filtrar por app_label si se proporciona
        app_label = self.request.query_params.get('app_label', None)
        if app_label:
            queryset = queryset.filter(app_label=app_label)
        
        # Filtrar por modelo si se proporciona
        model = self.request.query_params.get('model', None)
        if model:
            queryset = queryset.filter(model=model)
        
        return queryset

class RolPersonalizadoViewSet(viewsets.ModelViewSet):
    """
    API para gestionar roles personalizados
    """
    queryset = RolPersonalizado.objects.all().order_by('name')
    serializer_class = RolPersonalizadoSerializer
    permission_classes = [IsSuperAdmin]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        rol = serializer.instance
        register_activity(
            self.request, 'create', 'Rol Personalizado', 
            str(rol.id), f"Creación de rol personalizado: {rol.name}"
        )
    
    def perform_update(self, serializer):
        rol = serializer.save()
        register_activity(
            self.request, 'update', 'Rol Personalizado', 
            str(rol.id), f"Actualización de rol personalizado: {rol.name}"
        )
    
    def perform_destroy(self, instance):
        rol_name = instance.name
        register_activity(
            self.request, 'delete', 'Rol Personalizado', 
            str(instance.id), f"Eliminación de rol personalizado: {rol_name}"
        )
        instance.delete()

@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def asignar_permisos_usuario(request):
    """
    Endpoint para asignar permisos directamente a un usuario
    """
    try:
        user_id = request.data.get('user_id')
        permission_ids = request.data.get('permission_ids', [])
        
        user = User.objects.get(id=user_id)
        permissions = Permission.objects.filter(id__in=permission_ids)
        
        # Asignar permisos
        user.user_permissions.set(permissions)
        
        # Registrar actividad
        register_activity(
            request, 'permission_change', 'Usuario', 
            str(user.id), f"Asignación de permisos a usuario: {user.username}"
        )
        
        return Response({
            'success': True,
            'message': f'Permisos asignados correctamente a {user.username}'
        })
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Usuario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Funciones para el sistema de respaldo
def perform_backup(backup_id):
    """
    Función para realizar el respaldo en un hilo separado
    """
    backup = None
    try:
        backup = SystemBackup.objects.get(id=backup_id)
        backup.status = 'in_progress'
        backup.save()
        
        # Crear directorio de respaldos si no existe
        from django.conf import settings
        
        # Determinar la carpeta de destino - puede ser personalizada, 'backups' o 'media/respaldos'
        if hasattr(backup, 'carpeta') and backup.carpeta:
            # Si se especificó una carpeta personalizada
            backup_dir = os.path.join(settings.BASE_DIR, backup.carpeta)
        else:
            # Carpeta predeterminada
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        # Generar nombre de archivo
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"{backup.name}_{timestamp}.sql"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Ejecutar el comando apropiado según el tipo de base de datos
        if 'sqlite' in settings.DATABASES['default']['ENGINE']:
            #############################################################
            # RESPALDO SQLITE3 (para desarrollo local y pruebas)
            #############################################################
            """
            SQLite es ideal para desarrollo local por su simplicidad.
            En este caso, simplemente hacemos un volcado SQL del archivo 
            de base de datos, que es un único archivo .sqlite3
            """
            db_path = settings.DATABASES['default']['NAME']
            if backup.backup_type == 'full' or backup.backup_type == 'data':
                # Usamos .dump para un respaldo completo SQL
                command = f"sqlite3 {db_path} .dump > {backup_path}"
                result = subprocess.run(command, shell=True, capture_output=True)
                
                if result.returncode != 0:
                    raise Exception(f"Error en el respaldo: {result.stderr.decode('utf-8')}")
            
            # Respaldo de archivos media si corresponde
            if backup.backup_type == 'full' or backup.backup_type == 'media':
                media_dir = settings.MEDIA_ROOT
                media_backup_dir = os.path.join(backup_dir, f"media_{timestamp}")
                
                if os.path.exists(media_dir) and os.listdir(media_dir):
                    # Usar shutil para copiar el directorio
                    import shutil
                    shutil.copytree(media_dir, media_backup_dir)
                    
                    # Si es solo media, actualizar la ruta
                    if backup.backup_type == 'media':
                        backup_path = media_backup_dir
        else:
            #############################################################
            # RESPALDO POSTGRESQL (para producción en Render)
            #############################################################
            """
            PostgreSQL es el motor de base de datos recomendado para 
            producción en Render. 
            
            IMPORTANTE: 
            1. Asegúrate que pg_dump esté instalado en el servidor
            2. Si usas Render, considera automatizar la exportación a servicios 
               de almacenamiento externo como S3, Dropbox o Google Drive
            3. La carpeta 'media' en Render es efímera, usa almacenamiento persistente
            """
            db_settings = settings.DATABASES['default']
            
            # Configurar variables para pg_dump
            db_name = db_settings['NAME']
            db_user = db_settings['USER']
            db_password = db_settings['PASSWORD']
            db_host = db_settings['HOST']
            db_port = db_settings.get('PORT', '5432')  # Puerto predeterminado de PostgreSQL
            
            # Crear respaldo SQL (datos)
            if backup.backup_type == 'full' or backup.backup_type == 'data':
                # Configurar entorno para pg_dump
                env = os.environ.copy()
                
                # PGPASSWORD es una variable de entorno que pg_dump usa para la autenticación
                env['PGPASSWORD'] = db_password
                
                # Comando pg_dump
                pg_cmd = [
                    'pg_dump',
                    '--clean',  # Añadir DROP antes de CREATE
                    '--if-exists',  # Usar IF EXISTS en los DROP
                    '--format=plain',  # Formato SQL plano
                    f'--host={db_host}',
                    f'--port={db_port}',
                    f'--username={db_user}',
                    f'--file={backup_path}',
                    db_name
                ]
                
                # Ejecutar comando
                try:
                    result = subprocess.run(pg_cmd, env=env, check=True, capture_output=True)
                except subprocess.CalledProcessError as e:
                    # Si falla el comando, intentar con método alternativo usando pipes
                    try:
                        pg_dump_alt = f"PGPASSWORD='{db_password}' pg_dump --clean --if-exists -h {db_host} -p {db_port} -U {db_user} -d {db_name} > {backup_path}"
                        result = subprocess.run(pg_dump_alt, shell=True, check=True)
                    except Exception as inner_e:
                        raise Exception(f"Error al ejecutar pg_dump: {str(e)}\nIntento alternativo: {str(inner_e)}")
            
            # Respaldo de archivos media si corresponde
            if backup.backup_type == 'full' or backup.backup_type == 'media':
                media_dir = settings.MEDIA_ROOT
                media_backup_dir = os.path.join(backup_dir, f"media_{timestamp}")
                
                if os.path.exists(media_dir) and os.listdir(media_dir):
                    # Usar shutil para copiar el directorio
                    import shutil
                    shutil.copytree(media_dir, media_backup_dir)
                    
                    # Si es solo media, actualizar la ruta
                    if backup.backup_type == 'media':
                        backup_path = media_backup_dir
        
        # Opcionalmente comprimir el respaldo
        if os.path.exists(backup_path):
            # Comprimir el archivo SQL con gzip
            import gzip
            compressed_path = f"{backup_path}.gz"
            with open(backup_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    f_out.write(f_in.read())
            
            # Eliminar el archivo sin comprimir
            os.remove(backup_path)
            backup_path = compressed_path
        
        # Actualizar información del respaldo
        backup.status = 'completed'
        backup.file_path = backup_path
        backup.completed_at = timezone.now()
        
        # Calcular tamaño
        if os.path.exists(backup_path):
            if os.path.isfile(backup_path):
                backup.size_bytes = os.path.getsize(backup_path)
            elif os.path.isdir(backup_path):  # para respaldos de media
                total_size = 0
                for dirpath, dirnames, filenames in os.walk(backup_path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        total_size += os.path.getsize(fp)
                backup.size_bytes = total_size
        
        backup.save()
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error al crear respaldo: {error_msg}")
        try:
            if backup:
                backup.status = 'failed'
                backup.notes = f"Error: {error_msg}"
                backup.save()
        except Exception as inner_error:
            print(f"Error al actualizar registro de respaldo: {str(inner_error)}")

# Función para restaurar un respaldo del sistema
def perform_restore(backup_id, user_id):
    """
    Función para restaurar el sistema a partir de un respaldo
    """
    backup = None
    try:
        backup = SystemBackup.objects.get(id=backup_id)
        
        # Verificar que el respaldo esté completado
        if backup.status != 'completed':
            raise Exception("No se puede restaurar desde un respaldo que no está completado")
        
        # Verificar que exista el archivo
        if not backup.file_path or not os.path.exists(backup.file_path):
            raise Exception("El archivo de respaldo no se encuentra en el sistema")
        
        from django.conf import settings
        
        # Determinar el tipo de base de datos
        is_sqlite = 'sqlite' in settings.DATABASES['default']['ENGINE']
        
        # Restaurar según el tipo de base de datos
        if is_sqlite:
            #############################################################
            # RESTAURACIÓN SQLITE3 (para desarrollo local y pruebas)
            #############################################################
            """
            Para SQLite, necesitamos cerrar todas las conexiones actuales
            antes de restaurar la base de datos, ya que es un único archivo.
            """
            # Para SQLite, debemos cerrar todas las conexiones antes de reemplazar el archivo
            from django.db import connections
            connections.close_all()
            
            db_path = settings.DATABASES['default']['NAME']
            
            # Si es un archivo comprimido, descomprimirlo primero
            backup_file = backup.file_path
            if backup_file.endswith('.gz'):
                import gzip
                import tempfile
                
                # Crear archivo temporal para descomprimir
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.sql')
                temp_file.close()
                
                # Descomprimir
                with gzip.open(backup_file, 'rb') as f_in:
                    with open(temp_file.name, 'wb') as f_out:
                        f_out.write(f_in.read())
                        
                backup_file = temp_file.name
            
            # Restaurar SQLite
            if backup.backup_type == 'data' or backup.backup_type == 'full':
                # Hacer copia de seguridad del archivo actual
                import shutil
                db_backup = f"{db_path}.bak"
                shutil.copy2(db_path, db_backup)
                
                try:
                    # Restaurar desde el SQL
                    command = f"sqlite3 {db_path} < {backup_file}"
                    result = subprocess.run(command, shell=True, capture_output=True)
                    
                    if result.returncode != 0:
                        # Si falla, restaurar desde la copia de seguridad
                        shutil.copy2(db_backup, db_path)
                        raise Exception(f"Error al restaurar: {result.stderr.decode('utf-8')}")
                finally:
                    # Eliminar el archivo temporal si se creó
                    if backup_file != backup.file_path:
                        os.unlink(backup_file)
                    
                    # Eliminar copia de seguridad
                    if os.path.exists(db_backup):
                        os.unlink(db_backup)
        else:
            #############################################################
            # RESTAURACIÓN POSTGRESQL (para producción en Render)
            #############################################################
            """
            Para PostgreSQL en producción, utilizamos la herramienta psql
            para restaurar el respaldo. Es importante asegurarse de que
            la herramienta esté disponible en el sistema.

            IMPORTANTE: En Render, considera limitaciones de tiempo para
            operaciones largas y posibles restricciones en el servicio.
            """
            db_settings = settings.DATABASES['default']
            
            # Configurar variables para psql
            db_name = db_settings['NAME']
            db_user = db_settings['USER']
            db_password = db_settings['PASSWORD']
            db_host = db_settings['HOST']
            db_port = db_settings.get('PORT', '5432')
            
            # Si es un archivo comprimido, descomprimirlo primero
            backup_file = backup.file_path
            if backup_file.endswith('.gz'):
                import gzip
                import tempfile
                
                # Crear archivo temporal para descomprimir
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.sql')
                temp_file.close()
                
                # Descomprimir
                with gzip.open(backup_file, 'rb') as f_in:
                    with open(temp_file.name, 'wb') as f_out:
                        f_out.write(f_in.read())
                        
                backup_file = temp_file.name
            
            # Restaurar PostgreSQL
            if backup.backup_type == 'data' or backup.backup_type == 'full':
                # Configurar entorno para psql
                env = os.environ.copy()
                env['PGPASSWORD'] = db_password
                
                # Comando psql para restauración
                psql_cmd = [
                    'psql',
                    f'--host={db_host}',
                    f'--port={db_port}',
                    f'--username={db_user}',
                    f'--dbname={db_name}',
                    f'--file={backup_file}'
                ]
                
                try:
                    # Ejecutar comando
                    result = subprocess.run(psql_cmd, env=env, check=True, capture_output=True)
                except subprocess.CalledProcessError as e:
                    # Si falla, intentar método alternativo
                    try:
                        psql_alt = f"PGPASSWORD='{db_password}' psql -h {db_host} -p {db_port} -U {db_user} -d {db_name} -f {backup_file}"
                        result = subprocess.run(psql_alt, shell=True, check=True)
                    except Exception as inner_e:
                        raise Exception(f"Error al restaurar con psql: {str(e)}\nIntento alternativo: {str(inner_e)}")
                finally:
                    # Eliminar el archivo temporal si se creó
                    if backup_file != backup.file_path:
                        os.unlink(backup_file)
        
        # Restaurar archivos media si corresponde
        if (backup.backup_type == 'media' or backup.backup_type == 'full') and os.path.isdir(backup.file_path):
            media_dir = settings.MEDIA_ROOT
            
            # Hacer copia de seguridad de los archivos actuales
            import shutil
            import tempfile
            
            # Crear directorio temporal para backup
            temp_dir = tempfile.mkdtemp(prefix='media_backup_')
            
            # Mover contenido actual a directorio temporal
            if os.path.exists(media_dir):
                for item in os.listdir(media_dir):
                    src = os.path.join(media_dir, item)
                    dst = os.path.join(temp_dir, item)
                    if os.path.exists(src):
                        shutil.move(src, dst)
            
            try:
                # Copiar archivos desde el respaldo
                for item in os.listdir(backup.file_path):
                    src = os.path.join(backup.file_path, item)
                    dst = os.path.join(media_dir, item)
                    if os.path.isdir(src):
                        shutil.copytree(src, dst, dirs_exist_ok=True)
                    else:
                        shutil.copy2(src, dst)
            except Exception as e:
                # En caso de error, restaurar desde la copia de seguridad
                if os.path.exists(media_dir):
                    for item in os.listdir(media_dir):
                        path = os.path.join(media_dir, item)
                        if os.path.isdir(path):
                            shutil.rmtree(path)
                        else:
                            os.unlink(path)
                
                for item in os.listdir(temp_dir):
                    src = os.path.join(temp_dir, item)
                    dst = os.path.join(media_dir, item)
                    shutil.move(src, dst)
                
                raise Exception(f"Error al restaurar archivos media: {str(e)}")
            finally:
                # Limpiar directorio temporal
                shutil.rmtree(temp_dir)
        
        # Registrar evento
        user = User.objects.get(id=user_id)
        UserActivity.objects.create(
            user=user,
            action_type='restore',
            entity_type='SystemBackup',
            entity_id=str(backup.id),
            description=f"Restauración del sistema desde respaldo: {backup.name}",
            ip_address="sistema"
        )
        
        return True, "Restauración completada exitosamente"
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error al restaurar desde respaldo: {error_msg}")
        
        try:
            # Registrar error
            if user_id:
                user = User.objects.get(id=user_id)
                UserActivity.objects.create(
                    user=user,
                    action_type='error',
                    entity_type='SystemBackup',
                    entity_id=str(backup.id) if backup else "0",
                    description=f"Error al restaurar: {error_msg}",
                    ip_address="sistema"
                )
        except Exception:
            pass
            
        return False, f"Error: {error_msg}"

class SystemBackupViewSet(viewsets.ModelViewSet):
    """
    API para gestionar respaldos del sistema
    
    Esta API permite crear, listar y eliminar respaldos de la base de datos y archivos media.
    
    CONFIGURACIÓN DE RESPALDOS:
    ----------------------------
    1. SQLite (desarrollo local): Los respaldos son archivos SQL generados con el comando
       'sqlite3 <db_file> .dump > <backup_file>' y se guardan en la carpeta especificada.
       
    2. PostgreSQL (producción en Render): 
       - Usa pg_dump para generar respaldos SQL
       - Requiere que PostgreSQL esté correctamente configurado
       - En Render, considere usar almacenamiento externo (AWS S3, Dropbox, etc.)
       - La carpeta 'media/' es volátil en Render, use almacenamiento persistente
    
    CARPETAS DE RESPALDO:
    ---------------------
    - 'backups/': Carpeta predeterminada (dentro del proyecto)
    - 'media/respaldos/': Mejor opción para acceso web (archivos servidos por Django)
    - Carpeta personalizada: Especificada por el usuario (debe existir o se creará)
    - Carpeta del sistema: Permite al usuario elegir cualquier carpeta de su sistema
    
    NOTAS IMPORTANTES:
    -----------------
    1. Para Render con PostgreSQL:
       - Instalar herramientas PostgreSQL en el servidor (pg_dump, psql)
       - Configurar variables de entorno con credenciales de la BD
       - Considerar tamaño y tiempo de ejecución para respaldos grandes
    
    2. LIMPIEZA:
       - Los respaldos no se eliminan automáticamente
       - Implemente una política de retención y limpieza periódica
    """
    queryset = SystemBackup.objects.all().order_by('-created_at')
    serializer_class = SystemBackupSerializer
    permission_classes = [IsSuperAdmin]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']  # Excluir PUT/PATCH
    
    def perform_create(self, serializer):
        # Verificar si se solicita usar carpeta del sistema
        usar_carpeta_sistema = self.request.data.get('usar_carpeta_sistema', False)
        
        if usar_carpeta_sistema:
            # Crear un respaldo temporal que no se guardará en la BD
            backup = SystemBackup(
                name=self.request.data.get('nombre', f'backup_{timezone.now().strftime("%Y%m%d")}'),
                backup_type='data',  # Por defecto solo datos
                created_by=self.request.user
            )
            
            # Procesar el respaldo directamente para descarga
            try:
                from django.conf import settings
                
                # Crear directorio temporal para el respaldo
                import tempfile
                temp_dir = tempfile.mkdtemp(prefix='system_backup_')
                
                # Generar el archivo de respaldo en carpeta temporal
                timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
                backup_filename = f"{backup.name}_{timestamp}.sql"
                backup_path = os.path.join(temp_dir, backup_filename)
                
                # Ejecutar el comando apropiado según tipo de BD
                if 'sqlite' in settings.DATABASES['default']['ENGINE']:
                    # Respaldo SQLite
                    db_path = settings.DATABASES['default']['NAME']
                    command = f"sqlite3 {db_path} .dump > {backup_path}"
                    result = subprocess.run(command, shell=True, capture_output=True)
                    
                    if result.returncode != 0:
                        raise Exception(f"Error en el respaldo: {result.stderr.decode('utf-8')}")
                else:
                    # Respaldo PostgreSQL
                    db_settings = settings.DATABASES['default']
                    db_name = db_settings['NAME']
                    db_user = db_settings['USER']
                    db_password = db_settings['PASSWORD']
                    db_host = db_settings['HOST']
                    db_port = db_settings.get('PORT', '5432')
                    
                    # Configurar entorno para pg_dump
                    env = os.environ.copy()
                    env['PGPASSWORD'] = db_password
                    
                    # Comando pg_dump
                    pg_cmd = [
                        'pg_dump',
                        '--clean',
                        '--if-exists',
                        '--format=plain',
                        f'--host={db_host}',
                        f'--port={db_port}',
                        f'--username={db_user}',
                        f'--file={backup_path}',
                        db_name
                    ]
                    
                    try:
                        result = subprocess.run(pg_cmd, env=env, check=True, capture_output=True)
                    except Exception as e:
                        # Intentar método alternativo
                        pg_dump_alt = f"PGPASSWORD='{db_password}' pg_dump --clean --if-exists -h {db_host} -p {db_port} -U {db_user} -d {db_name} > {backup_path}"
                        result = subprocess.run(pg_dump_alt, shell=True, check=True)
                
                # Comprimir el respaldo
                import gzip
                compressed_path = f"{backup_path}.gz"
                with open(backup_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        f_out.write(f_in.read())
                
                # Eliminar archivo sin comprimir
                os.remove(backup_path)
                
                # Registrar la actividad
                register_activity(
                    self.request, 'other', 'SystemBackup',
                    description=f"Respaldo para descarga directa: {backup.name}"
                )
                
                # Preparar la descarga
                with open(compressed_path, 'rb') as f:
                    filename = os.path.basename(compressed_path)
                    content_type = 'application/gzip'
                    
                    response = HttpResponse(f.read(), content_type=content_type)
                    response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                # Limpiar archivos temporales
                import shutil
                shutil.rmtree(temp_dir)
                
                # Devolver respuesta en lugar de guardar
                return response
                
            except Exception as e:
                # En caso de error, registrar y devolver mensaje
                error_msg = str(e)
                print(f"Error al crear respaldo para descarga directa: {error_msg}")
                register_activity(
                    self.request, 'error', 'SystemBackup',
                    description=f"Error en respaldo para descarga: {error_msg}"
                )
                return Response({
                    'success': False,
                    'message': f'Error al crear respaldo: {error_msg}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Comportamiento normal: guardar respaldo en servidor
            backup = serializer.save(created_by=self.request.user)
            
            # Registrar actividad
            register_activity(
                self.request, 'create', 'SystemBackup', 
                str(backup.id), f"Inicio de respaldo: {backup.name}"
            )
            
            # Iniciar el proceso de respaldo en un hilo separado
            backup_thread = threading.Thread(target=perform_backup, args=(backup.id,))
            backup_thread.daemon = True
            backup_thread.start()
    
    def perform_destroy(self, instance):
        # Eliminar el archivo si existe
        if instance.file_path and os.path.exists(instance.file_path):
            try:
                if os.path.isfile(instance.file_path):
                    os.remove(instance.file_path)
                elif os.path.isdir(instance.file_path):
                    import shutil
                    shutil.rmtree(instance.file_path)
            except Exception as e:
                print(f"Error al eliminar archivo de respaldo: {str(e)}")
        
        # Registrar actividad
        register_activity(
            self.request, 'delete', 'SystemBackup', 
            str(instance.id), f"Eliminación de respaldo: {instance.name}"
        )
        
        # Eliminar el registro
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Endpoint para restaurar el sistema a partir de un respaldo
        """
        backup = self.get_object()
        
        # Registrar actividad del intento
        register_activity(
            request, 'restore', 'SystemBackup', 
            str(backup.id), f"Intento de restauración desde: {backup.name}"
        )
        
        # Ejecutar la restauración en un hilo separado para no bloquear la respuesta
        restore_thread = threading.Thread(
            target=perform_restore, 
            args=(backup.id, request.user.id)
        )
        restore_thread.daemon = True
        restore_thread.start()
        
        return Response({
            'success': True,
            'message': 'Proceso de restauración iniciado. Espere mientras se completa.'
        })
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Endpoint para descargar un archivo de respaldo
        """
        backup = self.get_object()
        
        if backup.status != 'completed':
            return Response({
                'success': False,
                'message': 'El respaldo no está completado'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if not backup.file_path or not os.path.exists(backup.file_path):
            return Response({
                'success': False,
                'message': 'Archivo de respaldo no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Registrar actividad
        register_activity(
            request, 'other', 'SystemBackup', 
            str(backup.id), f"Descarga de respaldo: {backup.name}"
        )
        
        # Si es un directorio, comprimir primero
        if os.path.isdir(backup.file_path):
            import shutil
            import tempfile
            
            # Crear archivo temporal para el ZIP
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
            temp_file.close()
            
            # Comprimir el directorio
            shutil.make_archive(temp_file.name[:-4], 'zip', backup.file_path)
            zip_path = temp_file.name
            
            # Configurar descarga
            filename = os.path.basename(backup.file_path) + '.zip'
            content_type = 'application/zip'
            
            # Leer el archivo ZIP
            with open(zip_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type=content_type)
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            # Eliminar el archivo temporal
            os.unlink(zip_path)
            
            return response
        else:
            # Para archivos normales
            with open(backup.file_path, 'rb') as f:
                filename = os.path.basename(backup.file_path)
                
                # Determinar el tipo de contenido
                if filename.endswith('.gz'):
                    content_type = 'application/gzip'
                elif filename.endswith('.sql'):
                    content_type = 'application/sql'
                else:
                    content_type = 'application/octet-stream'
                
                response = HttpResponse(f.read(), content_type=content_type)
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response

class UserActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API para consultar el registro de actividades (solo lectura)
    """
    queryset = UserActivity.objects.all().order_by('-timestamp')
    serializer_class = UserActivitySerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ['action_type', 'entity_type', 'user']
    search_fields = ['description', 'entity_id', 'user__username']
    
    def get_queryset(self):
        queryset = UserActivity.objects.all().select_related('user').order_by('-timestamp')
        
        # Filtrar por fecha desde
        date_from = self.request.query_params.get('date_from', None)
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        
        # Filtrar por fecha hasta
        date_to = self.request.query_params.get('date_to', None)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Limitar resultados para evitar carga excesiva
        limit = self.request.query_params.get('limit', None)
        if limit:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except ValueError:
                pass
        
        return queryset
