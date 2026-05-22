"""
models.py — Core database models for Student Academic Resource Platform
Inspired by HamroCSIT architecture
"""
from django.db import models
from django.utils.text import slugify

class Department(models.Model):
    name = models.CharField(max_length=150, unique=True, help_text="e.g. B.Sc. CSIT, BCA, BIM")
    short_name = models.CharField(max_length=30, unique=True, help_text="e.g. CSIT, BCA")
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, blank=True, help_text="Lucide icon string e.g., Monitor")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.short_name or self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.short_name

class Semester(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='semesters')
    name = models.CharField(max_length=50, help_text="e.g. First Semester")
    number = models.PositiveSmallIntegerField(help_text="e.g. 1")
    slug = models.SlugField(max_length=100, blank=True)

    class Meta:
        ordering = ['number']
        unique_together = ('department', 'number')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.department.short_name}-{self.number}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.department.short_name} - {self.name}"

class Subject(models.Model):
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, blank=True, help_text="e.g. CSC109")
    slug = models.SlugField(max_length=250, blank=True)
    credit_hours = models.PositiveSmallIntegerField(default=3)
    objective = models.TextField(blank=True)

    class Meta:
        unique_together = ('semester', 'code')
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.code}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"

class SubjectResource(models.Model):
    RESOURCE_TYPES = [
        ('syllabus', 'Syllabus'),
        ('note', 'Note & Study Material'),
        ('old_question', 'Old Question Paper'),
        ('solution', 'Solution / Guidelines'),
        ('lab_report', 'Lab Report / Practical'),
        ('assignment', 'Assignment / Project'),
    ]

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=250, help_text="e.g., Unit 1: Introduction to IT, 2079 Regular Exam Paper")
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES)
    file = models.FileField(upload_to='resources/%Y/%m/')
    year = models.PositiveIntegerField(null=True, blank=True, help_text="For old questions (e.g. 2079)")
    contributor = models.CharField(max_length=150, blank=True, help_text="Name of the person who provided this")
    is_approved = models.BooleanField(default=False)
    downloads = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-year', 'title']

    def __str__(self):
        return f"[{self.get_resource_type_display()}] {self.title}"

class Notice(models.Model):
    title = models.CharField(max_length=300)
    content = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    date_published = models.DateField(auto_now_add=True)
    link = models.URLField(blank=True, help_text="Link to official notice if any")

    class Meta:
        ordering = ['-date_published']

    def __str__(self):
        return self.title

class ResourceRequest(SubjectResource):
    class Meta:
        proxy = True
        verbose_name = "Pending Resource Request"
        verbose_name_plural = "Pending Resource Requests"
