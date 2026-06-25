from __future__ import annotations

from app.schemas import ProductCatalogItem
from app.services.rules import load_rules


def get_products() -> list[ProductCatalogItem]:
    rules = load_rules()["rules"]
    seen: set[str] = set()
    products: list[ProductCatalogItem] = []
    for rule in rules:
        if rule["product_family"] in seen:
            continue
        seen.add(rule["product_family"])
        products.append(
            ProductCatalogItem(
                product_family=rule["product_family"],
                category=rule["category"],
                validation_status=rule["validation_status"],
                source_reference=rule.get("source_reference_placeholder"),
            )
        )
    return products

