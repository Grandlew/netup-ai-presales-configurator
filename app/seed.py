from sqlalchemy import select

from app.db.database import SessionLocal, create_all
from app.db.models import ProductRuleVersion
from app.services.rules import load_rules


def main() -> None:
    create_all()
    rules = load_rules()
    with SessionLocal() as session:
        existing = session.scalar(
            select(ProductRuleVersion).where(ProductRuleVersion.version == rules["version"])
        )
        if existing:
            return
        session.add(
            ProductRuleVersion(
                version=rules["version"],
                active=True,
                notes=rules.get("notes"),
            )
        )
        session.commit()


if __name__ == "__main__":
    main()
