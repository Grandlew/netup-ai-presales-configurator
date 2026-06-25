from __future__ import annotations

from functools import lru_cache
import yaml

from app.settings import get_settings


@lru_cache
def load_rules() -> dict:
    settings = get_settings()
    with settings.rules_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)

