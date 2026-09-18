"""Local benchmark fixture only. Not a production application template."""
import os
from urllib.parse import unquote, urlparse

SECRET_KEY = "local-benchmark-fixture-only-do-not-deploy"
DEBUG = False
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "testserver"]
INSTALLED_APPS = ["api"]
MIDDLEWARE = []
ROOT_URLCONF = "config.urls"
USE_TZ = True
TIME_ZONE = "UTC"
APPEND_SLASH = False
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"
LOGGING = {"version": 1, "disable_existing_loggers": False, "handlers": {"null": {"class": "logging.NullHandler"}}, "loggers": {"django.request": {"handlers": ["null"], "propagate": False}}}
url = urlparse(os.environ.get("DATABASE_URL", "postgres://postgres@localhost:5432/bench_elysia_django"))
if url.hostname not in ("localhost", "127.0.0.1", "::1") or url.path != "/bench_elysia_django":
    raise ValueError("This fixture only permits local bench_elysia_django")
DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": url.path[1:], "USER": unquote(url.username or "postgres"),
    "PASSWORD": unquote(url.password or ""), "HOST": url.hostname, "PORT": url.port or 5432,
    "CONN_MAX_AGE": 0,
    "CONN_HEALTH_CHECKS": False,
    "OPTIONS": {"pool": {"min_size": 1, "max_size": 10, "timeout": 30}},
}}
