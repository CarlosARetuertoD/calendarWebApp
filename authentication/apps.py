from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    verbose_name = 'Autenticación y Seguridad'

    def ready(self):
        # Las señales están desactivadas para evitar conflictos con el admin
        pass
