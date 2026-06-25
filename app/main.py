from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.db.database import create_all
from app.middleware import ErrorContextMiddleware, RequestContextMiddleware, RateLimitMiddleware
from app.settings import get_settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_all()
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

app.include_router(api_router)

