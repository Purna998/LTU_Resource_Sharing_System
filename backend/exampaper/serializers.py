from rest_framework import serializers
from .models import Department, Semester, Subject, SubjectResource, Notice


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class SemesterSerializer(serializers.ModelSerializer):
    department_slug = serializers.CharField(source='department.slug', read_only=True)
    subject_count = serializers.SerializerMethodField()
    resource_count = serializers.SerializerMethodField()

    class Meta:
        model = Semester
        fields = '__all__'

    def get_subject_count(self, obj):
        return obj.subjects.count()

    def get_resource_count(self, obj):
        # Only count APPROVED resources so students see accurate numbers
        return SubjectResource.objects.filter(
            subject__semester=obj, is_approved=True
        ).count()


class SubjectSerializer(serializers.ModelSerializer):
    semester_name = serializers.CharField(source='semester.name', read_only=True)
    semester_number = serializers.IntegerField(source='semester.number', read_only=True)
    department_name = serializers.CharField(source='semester.department.name', read_only=True)
    department_short_name = serializers.CharField(source='semester.department.short_name', read_only=True)
    department_slug = serializers.CharField(source='semester.department.slug', read_only=True)
    resource_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = '__all__'

    def get_resource_count(self, obj):
        # Only count approved resources
        return obj.resources.filter(is_approved=True).count()


class SubjectResourceSerializer(serializers.ModelSerializer):
    """Read serializer — exposes all fields for GET requests."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)

    class Meta:
        model = SubjectResource
        fields = '__all__'
        # These fields must never be set by an external API caller
        read_only_fields = ('is_approved', 'downloads', 'uploaded_at')


class SubjectResourceWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer — used exclusively for POST/PUT.
    Explicitly excludes privileged fields so no attacker can approve their
    own uploads or inflate download counts via the API.
    """
    class Meta:
        model = SubjectResource
        fields = ('subject', 'title', 'resource_type', 'file', 'year', 'contributor')


class NoticeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.short_name', read_only=True)

    class Meta:
        model = Notice
        fields = '__all__'
