import re
from django.urls import resolve
from django.utils.deprecation import MiddlewareMixin
from .models import UserActivity
from .views import get_client_ip

class ActivityLogMiddleware(MiddlewareMixin):
    """
    Middleware para registrar automáticamente actividades de usuarios
    en las peticiones API importantes
    """
    # Lista de patrones de URL que no se registrarán
    EXEMPT_URLS = [
        r'^/static/',
        r'^/media/',
        r'^/api/admin/logs/',  # Evitar recursión al consultar logs
        r'^/admin/jsi18n/',    # No registrar peticiones de internacionalización
    ]
    
    # Lista de patrones de URL que siempre queremos registrar
    IMPORTANT_URLS = [
        r'^/api/auth/login/',
        r'^/api/auth/logout/',
        r'^/api/admin/',
        r'^/api/admin/usuarios/',  # Especial atención a cambios en usuarios
        r'^/api/calendarBackend/(letras|pedidos|proveedores|empresas)/',
    ]
    
    def process_response(self, request, response):
        # No registrar si no hay usuario autenticado
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response
        
        # No registrar si es una solicitud OPTIONS (preflight CORS)
        if request.method == 'OPTIONS':
            return response
        
        # Obtener la URL y el método
        path = request.path
        method = request.method
        
        # Verificar si la URL está en la lista de exentas
        for pattern in self.EXEMPT_URLS:
            if re.match(pattern, path):
                return response
        
        # Determinar si debemos registrar esta actividad
        should_log = False
        
        # URLs importantes siempre se registran
        for pattern in self.IMPORTANT_URLS:
            if re.match(pattern, path):
                should_log = True
                break
        
        # Métodos que modifican datos
        if method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            should_log = True
        
        # Si no hay que registrar, salir
        if not should_log:
            return response
        
        # Determinar el tipo de acción según el método HTTP
        if method == 'GET':
            action_type = 'view'
        elif method == 'POST':
            action_type = 'create'
        elif method in ['PUT', 'PATCH']:
            action_type = 'update'
        elif method == 'DELETE':
            action_type = 'delete'
        else:
            action_type = 'other'
        
        # Determinar tipo de entidad y ID
        entity_type = "Desconocido"
        entity_id = None
        
        # Análisis de la URL para determinar entidad
        url_parts = path.strip('/').split('/')
        if len(url_parts) >= 2:
            if url_parts[0] == 'api':
                if len(url_parts) >= 3:
                    entity_type = url_parts[2].capitalize()  # Ej: usuarios, letras, etc.
                    
                    # Si hay un ID numérico, capturarlo
                    if len(url_parts) >= 4 and url_parts[3].isdigit():
                        entity_id = url_parts[3]
                        
        # Capturar cambios de rol para mayor seguridad
        if '/api/admin/usuarios/' in path and method in ['PUT', 'PATCH'] and entity_id:
            try:
                # Intentar detectar cambios de rol
                from django.contrib.auth.models import User
                from authentication.models import PerfilUsuario
                
                user_id = int(entity_id)
                body_data = {}
                
                # Capturar datos del cuerpo de la petición
                if hasattr(request, 'data'):
                    body_data = request.data
                
                # Verificar si hay cambios en el perfil
                if 'perfil' in body_data and 'rol' in body_data['perfil']:
                    nuevo_rol = body_data['perfil']['rol']
                    user = User.objects.get(id=user_id)
                    viejo_rol = user.perfil.rol if hasattr(user, 'perfil') else 'desconocido'
                    
                    # Registrar especialmente la reducción de privilegios
                    if viejo_rol == 'superadmin' and nuevo_rol != 'superadmin':
                        from .models import UserActivity
                        from .views import get_client_ip
                        
                        UserActivity.objects.create(
                            user=request.user,
                            action_type='permission_change',
                            entity_type='Usuario',
                            entity_id=str(user_id),
                            description=f"ATENCIÓN: Cambio de rol {viejo_rol} a {nuevo_rol} en usuario: {user.username}",
                            ip_address=get_client_ip(request),
                            user_agent=request.META.get('HTTP_USER_AGENT', '')
                        )
            except Exception as e:
                print(f"Error al verificar cambios de rol: {str(e)}")
        
        # Registrar la actividad
        try:
            from .models import UserActivity
            from .views import get_client_ip
            
            UserActivity.objects.create(
                user=request.user,
                action_type=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                description=f"{request.method} {request.path}",
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception as e:
            # No interrumpir la respuesta por errores en el registro
            print(f"Error al registrar actividad: {str(e)}")
            
        return response 