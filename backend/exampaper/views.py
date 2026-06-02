"""
views.py — Legacy template views.
All logic has been migrated to api_views.py and React frontend.
"""

from django.http import HttpResponse

def stub_view(request):
    """
    Fallback view for any deprecated template routes.
    The React frontend handles all UI rendering now.
    """
    return HttpResponse("This endpoint has been migrated to the REST API + React Frontend.")
