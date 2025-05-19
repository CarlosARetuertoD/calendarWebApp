from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('calendarBackend.urls')),
    path('api/auth/', include('authentication.urls')),  # URLs de autenticación
    path('api/admin/', include('administracion.urls')),  # URLs de administración
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name="index.html"))
]
