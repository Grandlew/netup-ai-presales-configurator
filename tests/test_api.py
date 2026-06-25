import os

from app.schemas import CustomerRequirements
from app.settings import get_settings


def sample_payload() -> dict:
    return CustomerRequirements(
        project_type="hotel",
        country="United States",
        subscribers_or_rooms=180,
        expected_concurrent_viewers=100,
        number_of_channels=85,
        signal_sources=["satellite", "ip_streams"],
        services=["live_tv", "epg", "catchup_tv", "video_on_demand"],
        viewer_devices=["smart_tv", "mobile"],
        delivery_mode="both",
        adaptive_bitrate_required=True,
        archive_days=7,
        average_channel_bitrate_mbps=6,
        budget_range="To be discussed",
        target_launch_date="2026-Q4",
        contact_name="Jane Doe",
        company="Northwind Hospitality",
        email="jane@example.com",
    ).model_dump(mode="json")


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_recommend_endpoint(client):
    response = client.post("/recommend", json=sample_payload())
    assert response.status_code == 200
    assert response.json()["recommendations"]


def test_conversation_extract_reports_not_configured_when_api_key_missing(client):
    original_key = os.environ.get("OPENAI_API_KEY")
    os.environ["OPENAI_API_KEY"] = ""
    get_settings.cache_clear()

    try:
        response = client.post(
            "/api/conversation/extract",
            json={"message": "We have a 180-room hotel with 85 satellite channels.", "current_requirements": {}},
        )
    finally:
        if original_key is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = original_key
        get_settings.cache_clear()

    assert response.status_code == 200
    body = response.json()
    assert body["ai_available"] is False
    assert body["extraction_succeeded"] is False
    assert body["error_code"] == "ai_not_configured"
    assert body["message"] == "Natural-language intake is currently unavailable because the AI service is not configured."
    assert body["next_question"] is None


def test_catalog_and_config_endpoints(client):
    products = client.get("/api/products")
    assert products.status_code == 200
    assert products.json()

    config = client.get("/api/config/options")
    assert config.status_code == 200
    assert config.json()["project_types"]


def test_lead_and_report_endpoints(client):
    recommendation = client.post("/recommend", json=sample_payload()).json()
    lead_response = client.post(
        "/api/leads",
        json={
            "contact_name": "Jane Doe",
            "email": "jane@example.com",
            "company": "Northwind Hospitality",
            "country": "United States",
            "project_type": "hotel",
            "requirements": sample_payload(),
            "recommendation": recommendation,
            "source": "wizard",
            "consent_given": True,
        },
    )
    assert lead_response.status_code == 200
    lead_id = lead_response.json()["id"]

    get_lead = client.get(f"/api/leads/{lead_id}")
    assert get_lead.status_code == 200

    report_response = client.post(
        "/api/reports",
        json={
            "lead_id": lead_id,
            "requirements": sample_payload(),
            "recommendation": recommendation,
        },
    )
    assert report_response.status_code == 200
    report_id = report_response.json()["id"]

    get_report = client.get(f"/api/reports/{report_id}")
    assert get_report.status_code == 200
    assert "Preliminary Solution Recommendation" in get_report.json()["generated_content"]


def test_lead_requires_consent(client):
    recommendation = client.post("/recommend", json=sample_payload()).json()
    response = client.post(
        "/api/leads",
        json={
            "contact_name": "Jane Doe",
            "email": "jane@example.com",
            "requirements": sample_payload(),
            "recommendation": recommendation,
            "consent_given": False,
        },
    )
    assert response.status_code == 422
