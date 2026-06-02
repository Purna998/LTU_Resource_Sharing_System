from django.contrib import admin
from django.utils.html import format_html
import logging

from .models import (
    Department,
    Semester,
    Subject,
    SubjectResource,
    Notice,
    ResourceRequest
)

logger = logging.getLogger(__name__)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'short_name', 'slug')
    prepopulated_fields = {'slug': ('short_name',)}
    search_fields = ('name', 'short_name')


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('name', 'number', 'department', 'slug')
    prepopulated_fields = {'slug': ('department', 'number')}
    list_filter = ('department',)
    search_fields = ('name', 'department__name')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'semester', 'credit_hours')
    list_filter = ('semester__department', 'semester')
    search_fields = ('name', 'code')
    prepopulated_fields = {'slug': ('code', 'name')}


@admin.register(SubjectResource)
class SubjectResourceAdmin(admin.ModelAdmin):
    """
    Main admin interface for ALL resources (both approved and pending).
    """
    list_display = (
        'title', 'subject', 'resource_type', 'is_approved', 
        'downloads', 'uploaded_at', 'file_link'
    )
    list_filter = ('is_approved', 'resource_type', 'year')
    search_fields = ('title', 'contributor', 'subject__name', 'subject__code')
    readonly_fields = ('downloads', 'uploaded_at') # Prevent manual editing
    raw_id_fields = ('subject',) # Performance: Don't load 1000s of subjects in a dropdown
    list_per_page = 25
    date_hierarchy = 'uploaded_at'
    
    actions = ['approve_resources', 'reject_resources']

    def file_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">View File</a>', obj.file.url)
        return "No file"
    file_link.short_description = 'File'

    @admin.action(description='Mark selected resources as APPROVED')
    def approve_resources(self, request, queryset):
        count = queryset.update(is_approved=True)
        self.message_user(request, f"{count} resources have been APPROVED.")
        logger.info(f"AUDIT: Admin '{request.user}' bulk approved {count} resources.")

    @admin.action(description='Mark selected resources as REJECTED (Pending)')
    def reject_resources(self, request, queryset):
        count = queryset.update(is_approved=False)
        self.message_user(request, f"{count} resources have been moved back to PENDING.")
        logger.info(f"AUDIT: Admin '{request.user}' bulk rejected {count} resources.")


@admin.register(ResourceRequest)
class ResourceRequestAdmin(admin.ModelAdmin):
    """
    Moderation Queue Admin.
    Uses the proxy model to ONLY show items where is_approved=False.
    Makes it easy for admins to see what needs review.
    """
    list_display = ('title', 'subject', 'resource_type', 'contributor', 'uploaded_at', 'file_link')
    list_filter = ('resource_type',)
    search_fields = ('title', 'contributor')
    readonly_fields = ('downloads', 'uploaded_at')
    raw_id_fields = ('subject',)
    
    actions = ['approve_requests']

    def get_queryset(self, request):
        # Force the queryset to only show pending items
        qs = super().get_queryset(request)
        return qs.filter(is_approved=False)

    def file_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">Review File</a>', obj.file.url)
        return "No file"

    @admin.action(description='APPROVE selected requests')
    def approve_requests(self, request, queryset):
        count = queryset.update(is_approved=True)
        self.message_user(request, f"Successfully approved {count} requests.")
        logger.info(f"AUDIT: Admin '{request.user}' approved {count} requests from the moderation queue.")

    # Hide the "Add" button here — requests are uploaded via API, not admin
    def has_add_permission(self, request):
        return False


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'date_published')
    list_filter = ('department', 'date_published')
    search_fields = ('title', 'content')
    date_hierarchy = 'date_published'
