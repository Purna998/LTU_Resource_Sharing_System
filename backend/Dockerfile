# Use official slim Python image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies needed for Postgres and building packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Collect static files (handled at runtime if using Whitenoise, but good practice to run during build if env vars allow)
# We skip it here because secret keys might be required; we'll rely on Whitenoise or a startup script.

# Default command to run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "resourcesharing.wsgi:application"]
