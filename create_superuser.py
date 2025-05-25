# create_superuser.py

from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError

def run():
    User = get_user_model()
    username = "admin"
    email = "admin@example.com"
    password = "contraseña_super_segura"  # Cámbiala después

    if not User.objects.filter(username=username).exists():
        try:
            User.objects.create_superuser(username, email, password)
            print("Superusuario creado exitosamente.")
        except IntegrityError:
            print("Ya existe un superusuario.")
    else:
        print("El superusuario ya existe.")