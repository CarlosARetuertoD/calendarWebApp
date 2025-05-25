# create_superuser.py

from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from authentication.models import PerfilUsuario

def run():
    User = get_user_model()
    usuarios = [
        {"username": "redel", "email": "cretuertodelgado@gmail.com", "password": "redel", "rol": "superadmin"},
        {"username": "admin", "email": "admin@example.com", "password": "admin", "rol": "admin"},
        {"username": "user", "email": "user@example.com", "password": "user", "rol": "lectura"},
    ]

    for u in usuarios:
        if not User.objects.filter(username=u["username"]).exists():
            try:
                if u["rol"] == "superadmin":
                    user = User.objects.create_superuser(u["username"], u["email"], u["password"])
                    print(f"Superusuario '{u['username']}' creado exitosamente.")
                else:
                    user = User.objects.create_user(u["username"], u["email"], u["password"])
                    user.is_staff = u["rol"] == "admin"
                    user.save()
                    PerfilUsuario.objects.update_or_create(user=user, defaults={"rol": u["rol"]})
                    print(f"Usuario '{u['username']}' con rol '{u['rol']}' creado exitosamente.")
            except IntegrityError:
                print(f"Ya existe el usuario '{u['username']}'.")
        else:
            print(f"El usuario '{u['username']}' ya existe.")