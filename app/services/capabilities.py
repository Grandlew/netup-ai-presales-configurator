from __future__ import annotations

from functools import lru_cache

import yaml

from app.settings import get_settings


@lru_cache
def load_capabilities() -> dict:
    settings = get_settings()
    with settings.capabilities_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


@lru_cache
def capability_products_by_id() -> dict[str, dict]:
    registry = load_capabilities()
    return {product["canonical_product_id"]: product for product in registry["products"]}
