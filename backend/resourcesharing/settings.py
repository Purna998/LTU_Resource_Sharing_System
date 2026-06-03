"""
settings.py — Production-ready Django settings for Resource Sharing System.

ALL secrets MUST be supplied as environment variables.
The app will raise ImproperlyConfigured on startup if any required variable is missing.

Required env vars:
    DJANGO_SECRET_KEY       — Django secret key (generate with: python -c "import secrets; print(secrets.token_urlsafe(50))")
    DATABASE_URL            — PostgreSQL connection string (provided by Render)

Optional env vars (have safe defaults):
    DJANGO_DEBUG            — 'True' for local dev only, default: 'False'
    ALLOWED_HOSTS           — Comma-separated hostnames, default: 'localhost,127.0.0.1'
    CORS_ALLOWED_ORIGINS    — Comma-separated frontend URLs
    REDIS_URL               — Redis connection URL, default: 'redis://127.0.0.1:6379/1'
    DJANGO_LOG_LEVEL        — Logging level, default: 'INFO'

S3 Storage (set USE_S3=True to enable):
    USE_S3                  — 'True' to use S3 for media files
    AWS_ACCESS_KEY_ID       — AWS access key
    AWS_SECRET_ACCESS_KEY   — AWS secret key
    AWS_STORAGE_BUCKET_NAME — S3 bucket name
    AWS_S3_REGION_NAME      — AWS region, default: 'us-east-1'
"""

from pathlib import Path
import os
import sys
import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# ──────────────────────────────────────────────
# Base
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# Load local .env file if it exists (for local development)
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass


def get_required_env(name: str) -> str:
    """Retrieve a required environment variable or raise a loud error at startup."""
    value = os.environ.get(name)
    if not value:
        raise ImproperlyConfigured(
            f"Required environment variable '{name}' is not set. "
            f"Check your .env file or deployment environment configuration."
        )
    return value


# ──────────────────────────────────────────────
# Security
# ──────────────────────────────────────────────
# Fail loudly in production if the secret key is missing.
# For local dev, you can set it in a .env file (use python-decouple or export manually).
if 'test' in sys.argv:
    # Allow tests to run without a real key
    SECRET_KEY = 'test-only-secret-key-not-for-production'
else:
    SECRET_KEY = get_required_env('DJANGO_SECRET_KEY')

# Default to False — production-safe. Explicitly set DJANGO_DEBUG=True for local dev.
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get(
    'ALLOWED_HOSTS', 'localhost,127.0.0.1,ltu-resource-sharing-backend3.onrender.com,ltu-resource-sharing-backend-r91n.onrender.com'
).split(',')

# Strip whitespace from host entries (common misconfiguration)
ALLOWED_HOSTS = [h.strip() for h in ALLOWED_HOSTS]


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
    'django_filters',

    # Our apps
    'exampaper',
]


# ──────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise serves static files efficiently in production (admin CSS, etc.)
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
        'DIRS': [],
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
# Database — PostgreSQL via DATABASE_URL
# ──────────────────────────────────────────────
# Uses dj-database-url to parse DATABASE_URL (Neon DB URL expected in production).
# Fallback to local PostgreSQL ONLY in local development when DATABASE_URL is not set.
_database_url = os.environ.get('DATABASE_URL')

if _database_url:
    DATABASES = {
        'default': dj_database_url.config(
            default=_database_url,
            conn_max_age=600,           # Persistent connections (10 min)
            conn_health_checks=True,    # Drop unhealthy connections
        )
    }
else:
    if not DEBUG:
        raise ImproperlyConfigured(
            "DATABASE_URL environment variable is required in production (Use Neon DB connection string). "
            "Set DJANGO_DEBUG=True for local PostgreSQL development."
        )
    # Local development fallback (Postgres)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'postgres'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }


# ──────────────────────────────────────────────
# Cache — Redis
# ──────────────────────────────────────────────
if DEBUG:
    # Local Redis
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1')
else:
    # Production Upstash Redis
    REDIS_URL = os.environ.get('REDIS_URL')
    if not REDIS_URL:
        raise ImproperlyConfigured(
            "REDIS_URL environment variable is required in production. "
            "Please provide your Upstash Redis connection string (e.g., rediss://default:password@endpoint:port)."
        )

# NOTE: You provided UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
# However, Django's standard cache backend (django-redis) uses the Redis protocol, 
# not REST. You should use the standard 'rediss://' URL provided by Upstash in 
# the 'REDIS_URL' environment variable for Django caching to work properly.

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": 5,
            "SOCKET_TIMEOUT": 5,
            "IGNORE_EXCEPTIONS": True,  # Gracefully degrade if Redis is unavailable
        },
        "KEY_PREFIX": "app",
    }
}

# Use Redis for session storage to prevent sticky-session issues on multi-worker Render
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"


# ──────────────────────────────────────────────
# Password Validation
# ──────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 10}},
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
# Static Files (WhiteNoise)
# ──────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ──────────────────────────────────────────────
# Media / File Storage
# ──────────────────────────────────────────────
# Use S3 in production for durable, scalable file storage.
# Render's local disk is EPHEMERAL — all local uploads are lost on every deploy.
USE_S3 = os.environ.get('USE_S3', 'False') == 'True'

if USE_S3:
    # AWS / S3 Configuration
    AWS_ACCESS_KEY_ID     = get_required_env('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = get_required_env('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = get_required_env('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME    = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')

    # Private bucket — no public read
    AWS_DEFAULT_ACL       = None
    AWS_S3_FILE_OVERWRITE = False

    # Generate pre-signed URLs for each file access (expires in 1 hour)
    AWS_QUERYSTRING_AUTH    = True
    AWS_QUERYSTRING_EXPIRE  = 3600

    # Custom domain (optional — for CloudFront CDN)
    # AWS_S3_CUSTOM_DOMAIN = os.environ.get('AWS_S3_CUSTOM_DOMAIN', '')

    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

    # Keep MEDIA_URL set for pre-signed URL generation to work correctly
    MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/'
else:
    # Local development: serve from disk
    MEDIA_URL  = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'


# ──────────────────────────────────────────────
# Default Auto Field
# ──────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ──────────────────────────────────────────────
# Security Headers
# ──────────────────────────────────────────────
# Always set safe defaults regardless of DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY    = False
X_FRAME_OPTIONS         = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY  = 'strict-origin-when-cross-origin'

if not DEBUG:
    # Production-only security settings (can be disabled for local docker testing)
    SECURE_BROWSER_XSS_FILTER      = True
    SECURE_SSL_REDIRECT             = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
    SESSION_COOKIE_SECURE           = os.environ.get('SESSION_COOKIE_SECURE', 'True') == 'True'
    CSRF_COOKIE_SECURE              = os.environ.get('CSRF_COOKIE_SECURE', 'True') == 'True'

    SECURE_HSTS_SECONDS             = 31536000   # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS  = True
    SECURE_HSTS_PRELOAD             = True

    # Proxy trust settings for Render (runs behind a load balancer)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST    = True


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
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
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
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'exampaper': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}


# ──────────────────────────────────────────────
# Django REST Framework
# ──────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,

    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],

    # Default: public read-only. Mutation endpoints override this individually.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],

    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],

    # Custom exception handler — normalises all error responses into a
    # consistent JSON shape for the React frontend.
    'EXCEPTION_HANDLER': 'exampaper.utils.custom_exception_handler',

    # Rate limiting to protect the upload endpoint from abuse / DoS
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',   # Anonymous users: 200 API calls/hour
        'user': '600/hour',   # Authenticated users: 600 calls/hour
        'upload': '10/hour',  # Tight limit on the upload endpoint specifically
    },

    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] + (['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),

}


# ──────────────────────────────────────────────
# CORS — Restrict to known frontend origins
# ──────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173'
    ).split(',')
    if origin.strip()
]

# Allow credentials for session-based auth (admin panel)
CORS_ALLOW_CREDENTIALS = True

# Expose content-disposition header so the frontend can read filenames
CORS_EXPOSE_HEADERS = ['Content-Disposition']

# Allow local dev ports to submit forms (e.g. Django admin) without CSRF failing
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ltu-resource-sharing-backend-r91n.onrender.com',
    'https://note-sharing-backend-n2y6.onrender.com',
]
