from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.database import SessionLocal, create_all
from app.db.models import Conversation, Lead, ProductRuleVersion, Report
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def setup_database() -> None:
    create_all()


@pytest.fixture(autouse=True)
def clean_database() -> Generator[None, None, None]:
    with SessionLocal() as session:
        session.execute(delete(Conversation))
        session.execute(delete(Report))
        session.execute(delete(ProductRuleVersion))
        session.execute(delete(Lead))
        session.commit()
    yield


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client
