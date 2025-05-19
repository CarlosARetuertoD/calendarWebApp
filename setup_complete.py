#!/usr/bin/env python
"""
SCRIPT DE CONFIGURACIÓN COMPLETA - CALENDAR_PAYMENTS

Este script realiza las siguientes operaciones:
1. Elimina la base de datos SQLite existente
2. Elimina todas las migraciones de las aplicaciones
3. Crea nuevas migraciones
4. Aplica las migraciones
5. Crea tres usuarios predefinidos:
   - carlos/admin (superadmin)
   - admin/admin (superadmin)
   - user/user1234 (lectura)
6. Elimina scripts antiguos de configuración

Uso:
$ python setup_complete.py
"""
import os
import sys
import shutil
import glob
import django
import subprocess
from pathlib import Path

# Colorear mensajes en la consola
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}=== {text} ==={Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}✖ {text}{Colors.ENDC}")

def print_step(text):
    print(f"{Colors.PURPLE}→ {text}{Colors.ENDC}")

# Configurar ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent

# Lista de apps que tienen migraciones
APPS = ['calendarBackend', 'authentication', 'administracion']

# Scripts antiguos para eliminar
OLD_SCRIPTS = [
    'reset_database.py',
    'reset_database_and_create_users.py', 
    'configurar_usuarios.py',
    'set_admin_role.py',
    'create_users.py',
    'reset_admin.py',
    'create_test_user.py', 
    'create_specific_users.py',
    'create_users_simple.py',
    'setup_project.py'
]

def check_environment():
    """Verifica el entorno de ejecución"""
    print_header("VERIFICANDO ENTORNO")
    
    # Verificar que estamos en el directorio correcto (debe existir manage.py)
    if not (BASE_DIR / 'manage.py').exists():
        print_error("No se encuentra manage.py. Asegúrate de ejecutar este script desde el directorio raíz del proyecto.")
        sys.exit(1)
    print_success("Directorio del proyecto correcto")
    
    # Verificar entorno virtual
    env_active = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    if not env_active:
        print_warning("No se detectó un entorno virtual activo. Es recomendable usar un entorno virtual.")
    else:
        print_success("Entorno virtual activo")

def clean_database():
    """Elimina la base de datos SQLite existente"""
    print_header("LIMPIANDO BASE DE DATOS")
    
    db_path = BASE_DIR / 'db.sqlite3'
    if db_path.exists():
        print_step(f"Eliminando base de datos: {db_path}")
        os.remove(db_path)
        print_success("Base de datos eliminada")
    else:
        print_warning("Base de datos no encontrada, se creará una nueva")

def clean_migrations():
    """Elimina todos los archivos de migraciones"""
    print_header("LIMPIANDO MIGRACIONES")
    
    for app in APPS:
        migrations_dir = BASE_DIR / app / 'migrations'
        if migrations_dir.exists():
            print_step(f"Limpiando migraciones en: {app}")
            
            # Eliminar archivos .py excepto __init__.py
            for migration_file in migrations_dir.glob('*.py'):
                if migration_file.name != '__init__.py':
                    os.remove(migration_file)
                    print(f"  Eliminado: {migration_file.name}")
            
            # Eliminar archivos .pyc en __pycache__ si existe
            pycache_dir = migrations_dir / '__pycache__'
            if pycache_dir.exists():
                for pyc_file in pycache_dir.glob('*.pyc'):
                    os.remove(pyc_file)
                print("  Caché de migraciones limpiado")
            
            # Asegurar que existe __init__.py
            init_file = migrations_dir / '__init__.py'
            if not init_file.exists():
                with open(init_file, 'w') as f:
                    pass
                print("  Creado __init__.py")
        else:
            print_warning(f"Directorio de migraciones para {app} no encontrado")

def make_migrations():
    """Crea nuevas migraciones"""
    print_header("CREANDO NUEVAS MIGRACIONES")
    
    try:
        # Intentar crear migraciones para todas las apps juntas
        result = subprocess.run(
            [sys.executable, 'manage.py', 'makemigrations'],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        print_success("Migraciones creadas correctamente")
    except subprocess.CalledProcessError as e:
        print_error(f"Error al crear migraciones: {e}")
        print(e.stderr)
        
        # Intentar crear migraciones para cada app individualmente
        print_step("Intentando crear migraciones por app...")
        for app in APPS:
            try:
                result = subprocess.run(
                    [sys.executable, 'manage.py', 'makemigrations', app],
                    capture_output=True,
                    text=True,
                    check=True
                )
                print(f"  {app}: {result.stdout.strip()}")
            except subprocess.CalledProcessError as e:
                print_error(f"  Error en {app}: {e.stderr.strip()}")

def apply_migrations():
    """Aplica las migraciones a la base de datos"""
    print_header("APLICANDO MIGRACIONES")
    
    try:
        # Migrar auth primero para asegurar que las tablas de usuario existan
        subprocess.run(
            [sys.executable, 'manage.py', 'migrate', 'auth'],
            capture_output=True,
            text=True,
            check=True
        )
        print_success("Migraciones de autenticación aplicadas")
        
        # Migrar el resto
        result = subprocess.run(
            [sys.executable, 'manage.py', 'migrate'],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        print_success("Todas las migraciones aplicadas correctamente")
    except subprocess.CalledProcessError as e:
        print_error(f"Error al aplicar migraciones: {e}")
        print(e.stderr)
        sys.exit(1)

def create_users():
    """Crea usuarios predefinidos en la base de datos"""
    print_header("CREANDO USUARIOS")
    
    # Configurar entorno Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    
    # Importar modelos
    try:
        from django.contrib.auth.models import User
        from authentication.models import PerfilUsuario
        from rest_framework.authtoken.models import Token
        from django.db import transaction
    except ImportError as e:
        print_error(f"Error al importar modelos: {e}")
        print_warning("Asegúrate de que las migraciones se han aplicado correctamente.")
        sys.exit(1)
    
    # Lista de usuarios a crear: (username, password, email, rol, is_staff, is_superuser)
    users_to_create = [
        ('carlos', 'admin', 'carlos@example.com', 'superadmin', True, True),
        ('admin', 'admin', 'admin@example.com', 'superadmin', True, True),
        ('user', 'user1234', 'user@example.com', 'lectura', True, False),
    ]
    
    # Eliminar todos los usuarios existentes
    User.objects.all().delete()
    print_step("Base de usuarios limpiada")
    
    # Crear usuarios nuevos
    for username, password, email, rol, is_staff, is_superuser in users_to_create:
        try:
            with transaction.atomic():
                # Crear usuario
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    is_staff=is_staff,
                    is_superuser=is_superuser
                )
                
                # Crear perfil
                perfil = PerfilUsuario.objects.create(
                    user=user,
                    rol=rol
                )
                
                # Crear token para el usuario
                token, _ = Token.objects.get_or_create(user=user)
                
                print_success(f'Usuario {username} creado:')
                print(f'  - Contraseña: {password}')
                print(f'  - Rol: {rol}')
                print(f'  - Token: {token.key}')
        except Exception as e:
            print_error(f"Error al crear usuario {username}: {e}")

def cleanup_old_scripts():
    """Elimina scripts antiguos de configuración"""
    print_header("LIMPIANDO SCRIPTS ANTIGUOS")
    
    for script in OLD_SCRIPTS:
        script_path = BASE_DIR / script
        if script_path.exists():
            os.remove(script_path)
            print_success(f"Eliminado: {script}")

def main():
    """Función principal que ejecuta todo el proceso"""
    print(f"\n{Colors.BOLD}{Colors.GREEN}===== CONFIGURACIÓN COMPLETA DEL PROYECTO CALENDAR_PAYMENTS ====={Colors.ENDC}\n")
    
    # Ejecutar cada paso
    check_environment()
    clean_database()
    clean_migrations()
    make_migrations()
    apply_migrations()
    create_users()
    cleanup_old_scripts()
    
    # Mensaje final
    print(f"\n{Colors.BOLD}{Colors.GREEN}===== CONFIGURACIÓN COMPLETADA CON ÉXITO ====={Colors.ENDC}")
    print(f"\n{Colors.BOLD}Los tres usuarios han sido creados:{Colors.ENDC}")
    print("1. carlos/admin (superadmin)")
    print("2. admin/admin (superadmin)")
    print("3. user/user1234 (lectura)")
    print(f"\nAhora puedes iniciar el servidor con: {Colors.BOLD}python manage.py runserver{Colors.ENDC}")

if __name__ == "__main__":
    main() 