"""
serializers.py — API serialization for LTU Resource Sharing.

Key optimizations:
  - Eliminated N+1 queries in Semester/Subject serializers using annotated fields.
  - Read-only fields enforced on server-managed properties (downloads, is_approved).
"""

from rest_framework import serializers
from .models import (
    Department,
    Semester,
    Subject,
    SubjectResource,
    Notice
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Department
        fields = ['id', 'name', 'short_name', 'slug', 'description', 'icon_name']


class SemesterSerializer(serializers.ModelSerializer):
    # This avoids N+1 DB queries by relying on a 'resource_count' annotation
    # computed in the api_views.py ViewSet get_queryset() method.
    resource_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model  = Semester
        fields = ['id', 'name', 'number', 'slug', 'department', 'resource_count']


class SubjectSerializer(serializers.ModelSerializer):
    # Avoids N+1 DB queries via ViewSet annotation
    resource_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model  = Subject
        fields = ['id', 'name', 'code', 'slug', 'semester', 'credit_hours', 'objective', 'resource_count']


class SubjectResourceSerializer(serializers.ModelSerializer):
    subject_name    = serializers.CharField(source='subject.name', read_only=True)
    department_name = serializers.CharField(source='subject.semester.department.name', read_only=True)
    file_size       = serializers.SerializerMethodField()
    
    # ReadOnly fields: Users cannot bypass moderation by sending is_approved=True,
    # nor can they fake download counts.
    is_approved     = serializers.BooleanField(read_only=True)
    downloads       = serializers.IntegerField(read_only=True)

    class Meta:
        model  = SubjectResource
        fields = [
            'id', 'subject', 'subject_name', 'department_name', 'title',
            'resource_type', 'file', 'file_size', 'year',
            'contributor', 'is_approved', 'downloads', 'uploaded_at'
        ]

    def get_file_size(self, obj):
        """Use cached file_size_bytes instead of fetching from storage backend."""
        size = obj.file_size_bytes
        if size is not None:
            for x in ['bytes', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {x}"
                size /= 1024.0
        return "Unknown"


class NoticeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model  = Notice
        fields = ['id', 'title', 'content', 'department', 'department_name', 'date_published', 'link']
