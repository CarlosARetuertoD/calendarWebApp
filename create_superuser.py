# create_superuser.py

from django.contrib.auth import get_user_model

def run():
    User = get_user_model()
    username = "admin"
    email = "admin@example.com"
    password = "contraseña_super_segura"

    user, created = User.objects.get_or_create(username=username, defaults={"email": email})
    if created:
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print("Superusuario creado exitosamente.")
    else:
        # ⚠️ Esto es temporal solo para resetear la password en el deploy
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print("Superusuario EXISTENTE, contraseña ACTUALIZADA.")