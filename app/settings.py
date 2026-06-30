from __future__ import annotations

from functools import lru_cache
import logging
import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv


logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent.parent
LOCAL_ENV_PATH = BASE_DIR / ".env"
DEFAULT_CORS_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")

if LOCAL_ENV_PATH.exists():
    load_dotenv(LOCAL_ENV_PATH, override=False)


def _clean_env_value(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in {'"', "'"}:
        cleaned = cleaned[1:-1].strip()
    return cleaned or None


def _parse_csv(value: str | None, *, default: tuple[str, ...] = ()) -> list[str]:
    source = value if value is not None else ",".join(default)
    normalized: list[str] = []
    for item in source.split(","):
        candidate = item.strip().rstrip("/")
        if candidate and candidate not in normalized:
            normalized.append(candidate)
    return normalized


class Settings:
    def __init__(self) -> None:
        self.app_name = "NetUP AI Presales Configurator"
        self.environment = (_clean_env_value(os.getenv("APP_ENV")) or "development").lower()
        self.database_url = _clean_env_value(os.getenv("DATABASE_URL")) or f"sqlite:///{(BASE_DIR / 'netup_presales.db').as_posix()}"
        self.cors_origins = _parse_csv(_clean_env_value(os.getenv("CORS_ORIGINS")), default=DEFAULT_CORS_ORIGINS)
        self.openai_api_key = _clean_env_value(os.getenv("OPENAI_API_KEY"))
        self.openai_model = _clean_env_value(os.getenv("OPENAI_MODEL")) or "gpt-5.4-mini"
        self.rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "30"))
        self.rate_limit_window_seconds = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        self.max_message_length = int(os.getenv("MAX_MESSAGE_LENGTH", "2000"))
        self.archive_overhead_percent = float(os.getenv("ARCHIVE_OVERHEAD_PERCENT", "10"))
        self.archive_safety_margin_percent = float(os.getenv("ARCHIVE_SAFETY_MARGIN_PERCENT", "15"))
        self.archive_redundancy_factor = float(os.getenv("ARCHIVE_REDUNDANCY_FACTOR", "1.0"))
        self.archive_recording_ratio = float(os.getenv("ARCHIVE_RECORDING_RATIO", "1.0"))
        self.bandwidth_overhead_percent = float(os.getenv("BANDWIDTH_OVERHEAD_PERCENT", "12"))
        self.bandwidth_safety_margin_percent = float(os.getenv("BANDWIDTH_SAFETY_MARGIN_PERCENT", "20"))
        self.report_output_dir = self._resolve_path(os.getenv("REPORT_OUTPUT_DIR", "generated_reports"))
        self.rules_path = self._resolve_path(os.getenv("PRODUCT_RULES_PATH", "config/product_rules.yaml"))
        self.capabilities_path = self._resolve_path(os.getenv("PRODUCT_CAPABILITIES_PATH", "config/product_capabilities.yaml"))
        self.data_retention_note = os.getenv(
            "DATA_RETENTION_NOTE",
            "Lead data is stored for presales follow-up and must be handled under your applicable privacy policy.",
        )

    def _resolve_path(self, value: str) -> Path:
        candidate = Path(value)
        return candidate if candidate.is_absolute() else (BASE_DIR / candidate).resolve()

    @property
    def is_production(self) -> bool:
        return self.environment in {"production", "prod"}

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def database_kind(self) -> str:
        if self.database_url.startswith("postgresql"):
            return "postgresql"
        if self.is_sqlite:
            return "sqlite"
        parsed = urlparse(self.database_url)
        return parsed.scheme or "unknown"

    @property
    def report_storage_mode(self) -> str:
        return "database"

    def validate(self) -> None:
        issues: list[str] = []

        if not self.rules_path.exists():
            issues.append(f"PRODUCT_RULES_PATH does not exist: {self.rules_path}")

        if self.is_production:
            if not os.getenv("DATABASE_URL"):
                issues.append("DATABASE_URL must be set in production.")
            if not self.cors_origins:
                issues.append("CORS_ORIGINS must include at least one allowed origin in production.")
            if any(origin == "*" for origin in self.cors_origins):
                issues.append("Wildcard CORS origins are not allowed in production.")

        if issues:
            raise RuntimeError("Invalid application configuration:\n- " + "\n- ".join(issues))

    def startup_summary(self) -> dict[str, object]:
        return {
            "environment": self.environment,
            "database_type": self.database_kind,
            "ai_configured": bool(self.openai_api_key),
            "allowed_origin_count": len(self.cors_origins),
            "report_storage_mode": self.report_storage_mode,
        }


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.report_output_dir.mkdir(parents=True, exist_ok=True)
    settings.validate()
    logger.info("Application configuration loaded", extra=settings.startup_summary())
    return settings
