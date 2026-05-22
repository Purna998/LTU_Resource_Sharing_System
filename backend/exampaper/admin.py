from django.contrib import admin
from .models import Department, Semester, Subject, SubjectResource, Notice, ResourceRequest

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('short_name', 'name')
    search_fields = ('name', 'short_name')

@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('department', 'number', 'name')
    list_filter = ('department',)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'semester')
    search_fields = ('name', 'code')
    list_filter = ('semester__department', 'semester')

@admin.register(SubjectResource)
class SubjectResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'resource_type', 'year', 'is_approved')
    list_filter = ('resource_type', 'is_approved', 'subject__semester__department')
    search_fields = ('title', 'contributor')
    actions = ['approve_resources']
        
    def approve_resources(self, request, queryset):
        queryset.update(is_approved=True)
    approve_resources.short_description = "Approve and Publish selected resources"

@admin.register(ResourceRequest)
class ResourceRequestAdmin(SubjectResourceAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_approved=False)

    def has_add_permission(self, request):
        # Requests should only come from the frontend, not manual admin entry
        return False

@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'date_published')
    list_filter = ('department',)
    search_fields = ('title',)