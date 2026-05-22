import os
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Department, Semester, Subject, SubjectResource, Notice
from .serializers import (
    DepartmentSerializer, SemesterSerializer,
    SubjectSerializer, SubjectResourceSerializer,
    SubjectResourceWriteSerializer, NoticeSerializer,
)

ALLOWED_UPLOAD_EXTENSIONS = {'.pdf'}
MAX_UPLOAD_MB = 20


@method_decorator(cache_page(60 * 15), name='dispatch')
class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    lookup_field = 'slug'


@method_decorator(cache_page(60 * 15), name='dispatch')
class SemesterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department__slug']


@method_decorator(cache_page(60 * 15), name='dispatch')
class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['semester__id', 'semester__department__slug']
    search_fields = ['name', 'code']


class SubjectResourceViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['subject__slug', 'resource_type', 'year']
    search_fields = ['title', 'contributor']

    def get_serializer_class(self):
        """Use the restricted write serializer for mutations."""
        if self.action in ('create', 'update', 'partial_update'):
            return SubjectResourceWriteSerializer
        return SubjectResourceSerializer

    def get_queryset(self):
        # Public list/retrieve: approved only.
        # Admin actions (update, destroy) see all.
        if self.action in ('list', 'retrieve'):
            return SubjectResource.objects.filter(is_approved=True)
        return SubjectResource.objects.all()

    @method_decorator(cache_page(60 * 15))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page(60 * 15))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        """
        Server-side enforcement: submissions are ALWAYS pending approval,
        regardless of what the caller sends in the request body.
        """
        # --- File validation ---
        uploaded_file = self.request.FILES.get('file')
        if uploaded_file:
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in ALLOWED_UPLOAD_EXTENSIONS:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'file': 'Only PDF files are accepted.'})
            if uploaded_file.size > MAX_UPLOAD_MB * 1024 * 1024:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'file': f'File must be under {MAX_UPLOAD_MB}MB.'})

        # Force is_approved=False and reset downloads to 0
        serializer.save(is_approved=False, downloads=0)


@method_decorator(cache_page(60 * 15), name='dispatch')
class NoticeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department__slug']
    search_fields = ['title']
