"""
views.py — All views for the LTU Exam Paper Portal.

URL Flow:
  /                           → Home (index)
  /departments/               → All departments
  /departments/<slug>/        → Semesters within a department
  /departments/<slug>/<sem>/  → Subjects within a semester
  /papers/<subject-slug>/     → Papers for a subject
  /download/<paper-id>/       → Tracked file download
  /api/subjects/              → AJAX: subjects for a semester
  /api/papers/                → AJAX: papers filtered by subject/year/type
  /search/                    → Full-text search page
"""

import json
from django.shortcuts             import render, get_object_or_404, redirect
from django.http                  import JsonResponse, FileResponse, Http404, HttpResponse
from django.views.decorators.http import require_GET
from django.core.paginator        import Paginator
from django.db.models             import Q, Count
from django.views.decorators.cache import cache_page

try:
    from .models import Department, Semester, Subject, PreviousYearPaper
except ImportError:
    # PreviousYearPaper model no longer exists. These legacy views are unused.
    # They will be fully removed in a future cleanup.
    Department = Semester = Subject = PreviousYearPaper = None


# ─────────────────────────────────────────────
# 1. HOME PAGE
# ─────────────────────────────────────────────
def index(request):
    """
    Landing page: show departments with paper counts + latest papers.
    """
    departments = Department.objects.filter(is_active=True).annotate(
        total_papers=Count('subjects__papers', distinct=True),
        total_subjects=Count('subjects', distinct=True),
    )
    latest_papers = PreviousYearPaper.objects.filter(
        is_active=True
    ).select_related(
        'subject', 'subject__semester', 'subject__department'
    ).order_by('-uploaded_at')[:6]

    context = {
        'departments': departments,
        'latest_papers': latest_papers,
        'total_papers': PreviousYearPaper.objects.filter(is_active=True).count(),
        'total_subjects': Subject.objects.filter(is_active=True).count(),
    }
    return render(request, 'index.html', context)


# ─────────────────────────────────────────────
# 2. DEPARTMENTS LIST
# ─────────────────────────────────────────────
def department_list(request):
    """
    Shows all active departments with their paper counts.
    """
    departments = Department.objects.filter(is_active=True).annotate(
        total_papers=Count('subjects__papers', distinct=True),
        total_subjects=Count('subjects', distinct=True),
    )
    return render(request, 'departments.html', {'departments': departments})


# ─────────────────────────────────────────────
# 3. SEMESTER LIST (for a Department)
# ─────────────────────────────────────────────
def semester_list(request, dept_slug):
    """
    Shows 8 semesters for a given department.
    """
    department = get_object_or_404(Department, slug=dept_slug, is_active=True)
    semesters = Semester.objects.filter(
        department=department, is_active=True
    ).annotate(
        total_papers=Count('subjects__papers', distinct=True),
        total_subjects=Count('subjects', distinct=True),
    ).order_by('number')

    return render(request, 'semesters.html', {
        'department': department,
        'semesters': semesters,
    })


# ─────────────────────────────────────────────
# 4. SUBJECT LIST (for a Semester)
# ─────────────────────────────────────────────
def subject_list(request, dept_slug, semester_number):
    """
    Shows all subjects for a given department + semester,
    with paper count per subject.
    """
    department = get_object_or_404(Department, slug=dept_slug, is_active=True)
    semester   = get_object_or_404(
        Semester, department=department, number=semester_number, is_active=True
    )
    subjects = Subject.objects.filter(
        semester=semester, department=department, is_active=True
    ).annotate(
        total_papers=Count('papers', distinct=True)
    ).order_by('code')

    return render(request, 'subjects.html', {
        'department': department,
        'semester': semester,
        'subjects': subjects,
    })


# ─────────────────────────────────────────────
# 5. PAPER LIST (for a Subject)
# ─────────────────────────────────────────────
def paper_list(request, subject_slug):
    """
    Shows all exam papers for a subject, with year/type filtering.
    """
    subject = get_object_or_404(Subject, slug=subject_slug, is_active=True)

    # Optional filters
    year      = request.GET.get('year')
    exam_type = request.GET.get('type')

    papers = PreviousYearPaper.objects.filter(
        subject=subject, is_active=True
    ).order_by('-year')

    if year:
        papers = papers.filter(year=year)
    if exam_type:
        papers = papers.filter(exam_type=exam_type)

    # Available years for filter dropdown
    available_years = PreviousYearPaper.objects.filter(
        subject=subject, is_active=True
    ).values_list('year', flat=True).distinct().order_by('-year')

    # Paginate
    paginator   = Paginator(papers, 12)
    page_number = request.GET.get('page', 1)
    page_obj    = paginator.get_page(page_number)

    return render(request, 'papers.html', {
        'subject':         subject,
        'department':      subject.department,
        'semester':        subject.semester,
        'page_obj':        page_obj,
        'available_years': available_years,
        'exam_types':      PreviousYearPaper.EXAM_TYPE_CHOICES,
        'selected_year':   year,
        'selected_type':   exam_type,
    })


# ─────────────────────────────────────────────
# 6. DOWNLOAD (tracked)
# ─────────────────────────────────────────────
def download_paper(request, paper_id):
    """
    Streams the PDF and increments the download counter atomically.
    Uses FileResponse for efficient streaming.
    """
    paper = get_object_or_404(PreviousYearPaper, pk=paper_id, is_active=True)

    if not paper.file:
        raise Http404("File not found.")

    # Increment download count (thread-safe, no race condition)
    paper.increment_downloads()

    # Stream the file
    try:
        response = FileResponse(
            paper.file.open('rb'),
            content_type='application/pdf'
        )
        filename = f"{paper.subject.code}_{paper.year}_{paper.exam_type}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except FileNotFoundError:
        raise Http404("File not found on server.")


# ─────────────────────────────────────────────
# 7. VIEW (inline PDF viewer)
# ─────────────────────────────────────────────
def view_paper(request, paper_id):
    """
    Opens the PDF in-browser for inline viewing.
    """
    paper = get_object_or_404(PreviousYearPaper, pk=paper_id, is_active=True)
    if not paper.file:
        raise Http404("File not found.")
    try:
        response = FileResponse(
            paper.file.open('rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = 'inline'
        return response
    except FileNotFoundError:
        raise Http404("File not found on server.")


# ─────────────────────────────────────────────
# 8. SEARCH PAGE
# ─────────────────────────────────────────────
def search(request):
    """
    Full-text search across subjects and papers.
    Supports filtering by department, semester, year.
    """
    query       = request.GET.get('q', '').strip()
    dept_slug   = request.GET.get('department', '')
    sem_num     = request.GET.get('semester', '')
    year        = request.GET.get('year', '')

    papers = PreviousYearPaper.objects.filter(is_active=True).select_related(
        'subject', 'subject__semester', 'subject__department'
    )

    if query:
        papers = papers.filter(
            Q(subject__name__icontains=query) |
            Q(subject__code__icontains=query) |
            Q(subject__department__name__icontains=query)
        )
    if dept_slug:
        papers = papers.filter(subject__department__slug=dept_slug)
    if sem_num:
        papers = papers.filter(subject__semester__number=sem_num)
    if year:
        papers = papers.filter(year=year)

    papers = papers.order_by('-year', 'subject__code')

    paginator   = Paginator(papers, 15)
    page_number = request.GET.get('page', 1)
    page_obj    = paginator.get_page(page_number)

    departments    = Department.objects.filter(is_active=True)
    available_years = PreviousYearPaper.objects.filter(
        is_active=True
    ).values_list('year', flat=True).distinct().order_by('-year')

    return render(request, 'search.html', {
        'query':           query,
        'page_obj':        page_obj,
        'departments':     departments,
        'available_years': available_years,
        'selected_dept':   dept_slug,
        'selected_sem':    sem_num,
        'selected_year':   year,
        'result_count':    paginator.count,
    })


# ─────────────────────────────────────────────
# 9. API: Subjects for a Semester (AJAX/jQuery)
# ─────────────────────────────────────────────
@require_GET
def api_subjects(request):
    """
    Returns JSON list of subjects for a given dept_slug + semester_number.
    Used by jQuery on the papers filter to dynamically populate subject dropdown.
    """
    dept_slug      = request.GET.get('department', '')
    semester_number = request.GET.get('semester', '')

    subjects = Subject.objects.filter(is_active=True)

    if dept_slug:
        subjects = subjects.filter(department__slug=dept_slug)
    if semester_number:
        subjects = subjects.filter(semester__number=semester_number)

    data = [
        {'id': s.id, 'code': s.code, 'name': s.name, 'slug': s.slug}
        for s in subjects.order_by('code')
    ]
    return JsonResponse({'subjects': data})


# ─────────────────────────────────────────────
# 10. API: Papers with filters (AJAX/jQuery)
# ─────────────────────────────────────────────
@require_GET
def api_papers(request):
    """
    Returns JSON list of papers filtered by subject_slug, year, exam_type.
    Used by jQuery on the papers page for live filtering without page reload.
    """
    subject_slug = request.GET.get('subject', '')
    year         = request.GET.get('year', '')
    exam_type    = request.GET.get('type', '')
    page_num     = int(request.GET.get('page', 1))

    papers = PreviousYearPaper.objects.filter(is_active=True).select_related(
        'subject', 'subject__department', 'subject__semester'
    )

    if subject_slug:
        papers = papers.filter(subject__slug=subject_slug)
    if year:
        papers = papers.filter(year=year)
    if exam_type:
        papers = papers.filter(exam_type=exam_type)

    papers = papers.order_by('-year')

    paginator = Paginator(papers, 12)
    page_obj  = paginator.get_page(page_num)

    data = {
        'count':       paginator.count,
        'num_pages':   paginator.num_pages,
        'current_page': page_num,
        'papers': [
            {
                'id':          p.id,
                'subject':     p.subject.name,
                'code':        p.subject.code,
                'department':  p.subject.department.name,
                'semester':    p.subject.semester.display_name,
                'year':        p.year,
                'exam_type':   p.get_exam_type_display(),
                'downloads':   p.download_count,
                'download_url': f'/download/{p.id}/',
                'view_url':    f'/view/{p.id}/',
                'uploaded_at': p.uploaded_at.strftime('%Y-%m-%d'),
            }
            for p in page_obj
        ]
    }
    return JsonResponse(data)


# ─────────────────────────────────────────────
# 11. Legacy exampaper URL (redirect to new)
# ─────────────────────────────────────────────
def exampaper(request):
    """Backward-compat redirect to department list."""
    return redirect('department_list')