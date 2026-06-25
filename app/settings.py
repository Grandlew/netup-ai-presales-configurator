from __future__ import annotations

from functools import lru_cache
import os
from pathlib import Path


class Settings:
    def __init__(self) -> None:
        self.app_name = "NetUP AI Presales Configurator"
        self.environment = os.getenv("APP_ENV", "development")
        self.database_url = os.getenv(
            "DATABASE_URL", "sqlite:///./netup_presales.db")
        raw_origins = os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        self.cors_origins = [origin.strip()
                             for origin in raw_origins.split(",") if origin.strip()]
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
        self.rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
        self.rate_limit_window_seconds = int(
            os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        self.max_message_length = int(os.getenv("MAX_MESSAGE_LENGTH", "2000"))
        self.archive_overhead_percent = float(
            os.getenv("ARCHIVE_OVERHEAD_PERCENT", "10"))
        self.archive_safety_margin_percent = float(
            os.getenv("ARCHIVE_SAFETY_MARGIN_PERCENT", "15"))
        self.archive_redundancy_factor = float(
            os.getenv("ARCHIVE_REDUNDANCY_FACTOR", "1.0"))
        self.archive_recording_ratio = float(
            os.getenv("ARCHIVE_RECORDING_RATIO", "1.0"))
        self.bandwidth_overhead_percent = float(
            os.getenv("BANDWIDTH_OVERHEAD_PERCENT", "12"))
        self.bandwidth_safety_margin_percent = float(
            os.getenv("BANDWIDTH_SAFETY_MARGIN_PERCENT", "20"))
        self.report_output_dir = Path(
            os.getenv("REPORT_OUTPUT_DIR", "generated_reports"))
        self.rules_path = Path(
            os.getenv("PRODUCT_RULES_PATH", "config/product_rules.yaml"))
        self.data_retention_note = os.getenv(
            "DATA_RETENTION_NOTE",
            "Lead data is stored for presales follow-up and must be handled under your applicable privacy policy.",
        )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.report_output_dir.mkdir(parents=True, exist_ok=True)
    return settings
