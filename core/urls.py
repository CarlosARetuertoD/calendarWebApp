from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
]

# Solo añadir MEDIA_URL en desarrollo si quieres
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# **MUY IMPORTANTE: Solo capturar re_path para rutas que NO sean /static o /media/**
urlpatterns += [
    re_path(r'^(?!static/|media/).*$', TemplateView.as_view(template_name="index.html")),
]