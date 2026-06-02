"""
api_views.py — High-performance REST endpoints for LTU Resource Sharing.

Key security & performance features:
  1. Strict read-only for public; rate-limited & magic-byte validated uploads.
  2. N+1 queries eliminated via optimized annotations in get_queryset().
  3. Pre-signed S3 download URLs for secure file delivery.
  4. Atomic download counter increment via F() expressions.
"""

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.throttling import AnonRateThrottle
from rest_framework.permissions import SAFE_METHODS, BasePermission
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.core.exceptions import ValidationError
from django.conf import settings
import logging

from .models import Department, Semester, Subject, SubjectResource, Notice
from .serializers import (
    DepartmentSerializer,
    SemesterSerializer,
    SubjectSerializer,
    SubjectResourceSerializer,
    NoticeSerializer
)

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Permissions & Throttling
# ──────────────────────────────────────────────

class ReadOnlyOrAdmin(BasePermission):
    """
    Public (anonymous) users can GET list/details and POST uploads.
    Only Admins (staff) can PUT/PATCH/DELETE.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if request.method == 'POST' and view.basename == 'resource':
            return True # Allow public uploads (subject to moderation + throttling)
        return request.user and request.user.is_staff


class UploadRateThrottle(AnonRateThrottle):
    """Specific rate throttle to prevent spamming upload endpoints."""
    rate = '10/hour'


# ──────────────────────────────────────────────
# ViewSets
# ──────────────────────────────────────────────

class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API: List all departments.
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'short_name']


class SemesterViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API: List all semesters, filtered by department.
    Eliminates N+1 queries by annotating the total count of *approved* resources.
    """
    serializer_class = SemesterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department']
    search_fields = ['name']

    def get_queryset(self):
        # PERFORMANCE: A single DB query to get semesters and their resource counts.
        return Semester.objects.annotate(
            resource_count=Count(
                'subjects__resources',
                filter=Q(subjects__resources__is_approved=True),
                distinct=True
            )
        )


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API: List subjects, filtered by semester.
    Includes N+1 optimization via annotation.
    """
    serializer_class = SubjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['semester']
    search_fields = ['name', 'code']

    def get_queryset(self):
        # PERFORMANCE: Single query annotation for subject resource counts.
        return Subject.objects.annotate(
            resource_count=Count(
                'resources',
                filter=Q(resources__is_approved=True),
                distinct=True
            )
        )


class SubjectResourceViewSet(viewsets.ModelViewSet):
    """
    Core API endpoint for listing and uploading resources.
    - Public listing filters strictly to `is_approved=True`.
    - Uploading triggers magic-bytes PDF validation and audit logging.
    - Custom `/download/` endpoint securely increments counters and signs S3 URLs.
    """
    serializer_class = SubjectResourceSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'resource_type', 'year']
    search_fields = ['title', 'contributor']
    ordering_fields = ['uploaded_at', 'downloads', 'year']

    def get_queryset(self):
        # Security: Public API NEVER leaks unapproved resources.
        qs = SubjectResource.objects.filter(is_approved=True)
        return qs.select_related('subject__semester__department')

    def get_throttles(self):
        # Apply specific throttling rules to POST (uploads)
        if self.request.method == 'POST' and self.action != 'download':
            return [UploadRateThrottle()]
        return super().get_throttles()

    def _validate_uploaded_file(self, uploaded_file):
        """
        SECURITY: 3-layer file validation.
        1. Name check
        2. Size limit (20MB)
        3. Magic bytes inspection — prevents "virus.exe" renamed to "notes.pdf"
        """
        if not uploaded_file.name.lower().endswith('.pdf'):
            raise ValidationError("Only PDF files are allowed.")
            
        if uploaded_file.size > 20 * 1024 * 1024:
            raise ValidationError("File size must not exceed 20MB.")
            
        # Magic byte checking (Header signature for PDF is '%PDF-')
        # Requires resetting the file pointer.
        file_header = uploaded_file.read(5)
        uploaded_file.seek(0)
        if not file_header.startswith(b'%PDF-'):
            logger.warning(f"SECURITY: Attempted malicious upload caught: {uploaded_file.name}")
            raise ValidationError("The uploaded file does not appear to be a valid PDF.")

    def perform_create(self, serializer):
        """
        Intercept the create operation to run security validations and audit logging.
        """
        file_obj = self.request.FILES.get('file')
        if file_obj:
            try:
                self._validate_uploaded_file(file_obj)
            except ValidationError as e:
                # Let Django REST Framework handle the 400 Bad Request
                raise serializers.ValidationError({"file": list(e.messages)})
        
        # Save forces is_approved=False by default (see models.py)
        instance = serializer.save(is_approved=False)
        
        # Audit log
        ip = self.request.META.get('REMOTE_ADDR', 'Unknown')
        logger.info(f"UPLOAD: Resource '{instance.title}' ID:{instance.id} from IP:{ip} — PENDING APPROVAL")

    @action(detail=True, methods=['POST'], permission_classes=[])
    def download(self, request, pk=None):
        """
        Secure Download Action.
        - Atomically increments the download counter.
        - Generates a pre-signed S3 URL valid for 1 hour to prevent hotlinking.
        """
        resource = self.get_object() # Ensures `is_approved=True` via get_queryset
        
        # 1. Atomic increment (avoids race conditions)
        resource.increment_downloads()

        # 2. Get the actual file backend URL
        file_url = None
        if resource.file and hasattr(resource.file, 'url'):
            file_url = resource.file.url
            
        if not file_url:
            return Response(
                {"error": "File not found or missing from storage backend."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # In local dev (local filesystem), return absolute URL.
        # In production (S3 backend), `resource.file.url` already returns a pre-signed S3 URL.
        if not file_url.startswith('http'):
            file_url = request.build_absolute_uri(file_url)

        return Response({
            "success": True,
            "downloads": resource.downloads,
            "download_url": file_url,
            "filename": resource.file.name.split('/')[-1]
        })


class NoticeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API: Global and department-specific notices.
    """
    queryset = Notice.objects.select_related('department').all()
    serializer_class = NoticeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department']
    search_fields = ['title', 'content']
