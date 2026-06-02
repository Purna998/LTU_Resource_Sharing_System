"""
models.py — Core database models for LTU Student Academic Resource Platform.

Key design decisions:
  - DB indexes on SubjectResource.is_approved + resource_type for fast filtered queries
  - Downloads incremented atomically via F() expression (see SubjectResource.increment_downloads)
  - is_approved defaults to False — all uploads pending admin review
  - Slug auto-generation on first save; never regenerated (stable URLs)
"""

from django.db import models
from django.db.models import F
from django.utils.text import slugify
import django.utils.timezone


class Department(models.Model):
    name        = models.CharField(max_length=150, unique=True, help_text="e.g. B.Sc. CSIT, BCA, BIM")
    short_name  = models.CharField(max_length=30,  unique=True, help_text="e.g. CSIT, BCA")
    slug        = models.SlugField(max_length=150, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon_name   = models.CharField(max_length=50, blank=True, help_text="Lucide icon string e.g. Monitor")

    class Meta:
        ordering        = ['name']
        verbose_name    = 'Department'
        verbose_name_plural = 'Departments'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.short_name or self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.short_name


class Semester(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='semesters'
    )
    name   = models.CharField(max_length=50, help_text="e.g. First Semester")
    number = models.PositiveSmallIntegerField(help_text="e.g. 1")
    slug   = models.SlugField(max_length=100, blank=True)

    class Meta:
        ordering        = ['number']
        unique_together = ('department', 'number')
        verbose_name    = 'Semester'
        verbose_name_plural = 'Semesters'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.department.short_name}-{self.number}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.department.short_name} — Sem {self.number}"


class Subject(models.Model):
    semester     = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='subjects')
    name         = models.CharField(max_length=200)
    code         = models.CharField(max_length=50, blank=True, help_text="e.g. CSC109")
    slug         = models.SlugField(max_length=250, blank=True)
    credit_hours = models.PositiveSmallIntegerField(default=3)
    objective    = models.TextField(blank=True)

    class Meta:
        unique_together = ('semester', 'code')
        ordering        = ['name']
        verbose_name    = 'Subject'
        verbose_name_plural = 'Subjects'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.code}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class SubjectResource(models.Model):
    RESOURCE_TYPES = [
        ('syllabus',     'Syllabus'),
        ('note',         'Note & Study Material'),
        ('old_question', 'Old Question Paper'),
        ('solution',     'Solution / Guidelines'),
        ('lab_report',   'Lab Report / Practical'),
        ('assignment',   'Assignment / Project'),
    ]

    subject       = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='resources')
    title         = models.CharField(max_length=250, help_text="e.g. Unit 1: Introduction to IT")
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES, db_index=True)
    file          = models.FileField(upload_to='resources/%Y/%m/')
    year          = models.PositiveIntegerField(null=True, blank=True, help_text="Bikram Sambat year, e.g. 2080")
    contributor   = models.CharField(max_length=150, blank=True, help_text="Name of the contributing student")

    # Privileged fields — only set by server logic, never by API callers
    is_approved   = models.BooleanField(
        default=False,   # IMPORTANT: False — all uploads pending admin review
        db_index=True,   # Index for fast approved-only filtering
        help_text="Set to True to publish this resource. Handled by admin approval workflow."
    )
    downloads     = models.PositiveIntegerField(default=0)
    uploaded_at   = models.DateTimeField(auto_now_add=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True, help_text="Cached file size to avoid S3 calls")

    class Meta:
        ordering        = ['-uploaded_at']
        verbose_name    = 'Subject Resource'
        verbose_name_plural = 'Subject Resources'
        indexes = [
            # Composite index for the most common API query pattern:
            # "Give me all approved resources of a given type for this subject"
            models.Index(
                fields=['subject', 'resource_type', 'is_approved'],
                name='res_subj_type_approved_idx',
            ),
        ]

    def increment_downloads(self):
        """
        Thread-safe, race-condition-free download counter increment.
        Uses a SQL UPDATE with F() expression — avoids read-modify-write cycles.
        Refreshes the in-memory instance to reflect the new count.
        """
        SubjectResource.objects.filter(pk=self.pk).update(downloads=F('downloads') + 1)
        self.refresh_from_db(fields=['downloads'])

    def save(self, *args, **kwargs):
        if self.file and not self.file_size_bytes:
            try:
                self.file_size_bytes = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.get_resource_type_display()}] {self.title}"


class Notice(models.Model):
    title          = models.CharField(max_length=300)
    content        = models.TextField()
    department     = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True
    )
    date_published = models.DateField(default=django.utils.timezone.now)
    link           = models.URLField(blank=True, help_text="Link to official notice if any")

    class Meta:
        ordering        = ['-date_published']
        verbose_name    = 'Notice'
        verbose_name_plural = 'Notices'

    def __str__(self):
        return self.title


class ResourceRequest(SubjectResource):
    """
    Proxy model used in Django admin to show only pending (unapproved) submissions
    as a separate admin section — provides a clean moderation queue UI.
    """
    class Meta:
        proxy               = True
        verbose_name        = 'Pending Resource Request'
        verbose_name_plural = 'Pending Resource Requests'
