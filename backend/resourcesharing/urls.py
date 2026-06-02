"""
urls.py — Root URL configuration for LTU Resource Sharing System.

All application data is served via the REST API in exampaper/api_views.py.
The React frontend on Vercel handles all UI rendering.
"""

from django.contrib import admin
from django.urls    import path, include
from django.conf    import settings
from django.conf.urls.static import static

# Customize admin site branding
admin.site.site_header = "LTU Resource Sharing — Admin Panel"
admin.site.site_title  = "LTU Admin"
admin.site.index_title = "Content Management"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('',       include('exampaper.urls')),
]

# Serve media files in local development only
# In production, files are served from S3 via pre-signed URLs
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
