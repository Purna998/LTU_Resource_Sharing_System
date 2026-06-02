"""
utils.py — Shared utilities for the exampaper application.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that returns consistent JSON error shapes.

    All error responses follow the shape:
        { "error": "<human-readable message>", "detail": <original detail> }

    This makes it easier for the React frontend to display reliable error messages.
    """
    # Call the default DRF handler first to get a standard Response object.
    response = exception_handler(exc, context)

    if response is not None:
        # Normalise the error payload into a predictable shape.
        original_detail = response.data
        if isinstance(original_detail, list) and len(original_detail) == 1:
            message = str(original_detail[0])
        elif isinstance(original_detail, dict):
            # Try to pick the most useful top-level message.
            message = str(
                original_detail.get('detail')
                or original_detail.get('non_field_errors', ['Unknown error'])[0]
                if isinstance(original_detail.get('non_field_errors'), list)
                else original_detail.get('detail', 'An error occurred.')
            )
        else:
            message = str(original_detail)

        response.data = {
            "error": message,
            "detail": original_detail,
        }

        # Log server-side errors (5xx) with full context for debugging.
        if response.status_code >= 500:
            logger.error(
                "Server error %s in %s: %s",
                response.status_code,
                context.get('view', 'unknown view'),
                exc,
                exc_info=True,
            )

    return response
