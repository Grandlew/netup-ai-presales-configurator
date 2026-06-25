import httpx

from app.dependencies import get_extractor
from app.schemas import CustomerRequirements
from app.services.ai_extractor import ConversationExtractor


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


def test_conversation_extract_fallback_without_key(client):
    response = client.post(
        "/api/conversation/extract",
        json={"message": "We have a 180-room hotel with 85 satellite channels.", "current_requirements": {}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ai_available"] is False
    assert body["next_question"]


def test_conversation_extract_fallback_when_upstream_ai_request_fails(client):
    class FailingExtractor(ConversationExtractor):
        @property
        def enabled(self) -> bool:
            return True

        async def extract(self, message, current):
            return await super().extract(message, current)

    original_post = httpx.AsyncClient.post

    async def failing_post(self, *args, **kwargs):
        request = httpx.Request("POST", "https://api.openai.com/v1/responses")
        response = httpx.Response(status_code=400, request=request, json={"error": {"message": "Unknown model"}})
        raise httpx.HTTPStatusError("Bad Request", request=request, response=response)

    client.app.dependency_overrides[get_extractor] = FailingExtractor
    httpx.AsyncClient.post = failing_post

    try:
        response = client.post(
            "/api/conversation/extract",
            json={"message": "We have a 180-room hotel with 85 satellite channels.", "current_requirements": {}},
        )
    finally:
        client.app.dependency_overrides.pop(get_extractor, None)
        httpx.AsyncClient.post = original_post

    assert response.status_code == 200
    body = response.json()
    assert body["ai_available"] is False
    assert body["next_question"]


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
