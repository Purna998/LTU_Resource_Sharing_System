"""
settings.py — Production-ready Django settings for LTU Exam Paper Portal.
Uses environment variables for secrets (python-decouple pattern).
"""

from pathlib import Path
import os

# ──────────────────────────────────────────────
# Base
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: Replace this with env variable in production!
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-ltu-exam-paper-portal-change-in-production-xyz123'
)

# SECURITY WARNING: Set to False in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ──────────────────────────────────────────────
# Installed Apps
# ──────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'corsheaders',

    # Our apps
    'exampaper',
]

# ──────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise for static files in production (optional, uncomment if deployed):
    # 'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'resourcesharing.urls'

# ──────────────────────────────────────────────
# Templates
# ──────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],          # App-level templates (APP_DIRS=True handles it)
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'resourcesharing.wsgi.application'

# ──────────────────────────────────────────────
# Database  (SQLite for dev | MySQL for prod)
# ──────────────────────────────────────────────
# To switch to MySQL, set DJANGO_DB=mysql and provide credentials via env vars.
_DB_ENGINE = os.environ.get('DJANGO_DB', 'sqlite')

if _DB_ENGINE == 'mysql':
    DATABASES = {
        'default': {
            'ENGINE':   'django.db.backends.mysql',
            'NAME':     os.environ.get('DB_NAME', 'ltu_exam_portal'),
            'USER':     os.environ.get('DB_USER', 'root'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST':     os.environ.get('DB_HOST', 'localhost'),
            'PORT':     os.environ.get('DB_PORT', '3306'),
            'OPTIONS': {
                'charset':    'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }
else:
    # Default: SQLite (great for development)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME':   BASE_DIR / 'db.sqlite3',
        }
    }

# ──────────────────────────────────────────────
# Cache (Redis for fast data retrieval)
# ──────────────────────────────────────────────
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# ──────────────────────────────────────────────
# Password Validation
# ──────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ──────────────────────────────────────────────
# Internationalization
# ──────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Asia/Kathmandu'
USE_I18N      = True
USE_TZ        = True

# ──────────────────────────────────────────────
# Static Files
# ──────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'   # collectstatic destination

# ──────────────────────────────────────────────
# Media Files (uploaded exam papers)
# ──────────────────────────────────────────────
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ──────────────────────────────────────────────
# Default Auto Field
# ──────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ──────────────────────────────────────────────
# Security Settings (enable in production)
# ──────────────────────────────────────────────
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER       = True
    SECURE_CONTENT_TYPE_NOSNIFF     = True
    SECURE_SSL_REDIRECT             = True
    SESSION_COOKIE_SECURE           = True
    CSRF_COOKIE_SECURE              = True
    X_FRAME_OPTIONS                 = 'DENY'
    SECURE_HSTS_SECONDS             = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS  = True

# ──────────────────────────────────────────────
# File Upload Settings
# ──────────────────────────────────────────────
# Max upload size: 20MB per file (keep in sync with api_views.py MAX_UPLOAD_MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

# ──────────────────────────────────────────────
# Django REST Framework & CORS
# ──────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Removed BasicAuthentication — it sends credentials in plain base64 on every request.
    # Add TokenAuthentication or JWT here when user accounts are introduced.
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend']
}

# ──────────────────────────────────────────────
# CORS — Restrict to known origins
# ──────────────────────────────────────────────
# In production, replace with your deployed frontend URL:
# CORS_ALLOWED_ORIGINS = ['https://hamrouni.ltu.edu.np']
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173'
).split(',')

# Allow credentials for session-based auth (admin panel etc.)
CORS_ALLOW_CREDENTIALS = True
