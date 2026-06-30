from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes import api_router, legacy_router
from app.db.database import create_all, ensure_database_connection
from app.middleware import ErrorContextMiddleware, RequestContextMiddleware, RateLimitMiddleware
from app.settings import get_settings


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.is_sqlite:
        create_all()
    ensure_database_connection()
    logger.info("Application startup complete", extra=settings.startup_summary())
    yield


settings = get_settings()

app = FastAPI(
    title="NetUP AI Presales Configurator",
    version="0.2.0",
    description=(
        "Deterministic NetUP presales recommendation API with structured "
        "questionnaire, lead capture, report generation, and optional AI-assisted extraction."
    ),
    lifespan=lifespan,
)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(ErrorContextMiddleware)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_window=settings.rate_limit_requests,
    window_seconds=settings.rate_limit_window_seconds,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if not settings.is_production else ["api-configurator.example.com", "*.onrender.com", "localhost", "127.0.0.1"],
)

app.include_router(api_router)
app.include_router(legacy_router)
