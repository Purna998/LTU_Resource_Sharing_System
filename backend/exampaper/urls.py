"""
urls.py — URL routing for the exampaper app.
All routes are API endpoints served to the React frontend.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    DepartmentViewSet,
    SemesterViewSet,
    SubjectViewSet,
    SubjectResourceViewSet,
    NoticeViewSet,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'semesters',   SemesterViewSet,   basename='semester')
router.register(r'subjects',    SubjectViewSet,    basename='subject')
router.register(r'resources',   SubjectResourceViewSet, basename='resource')
router.register(r'notices',     NoticeViewSet,     basename='notice')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
