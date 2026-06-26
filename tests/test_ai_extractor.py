import asyncio
import os
from contextlib import contextmanager

from app.schemas import AIExtractedRequirements, AIExtractionPayload, PartialCustomerRequirements
from app.services.ai_extractor import ConversationExtractor
from app.settings import get_settings


EXAMPLE_MESSAGE = "We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs. Plus catch-up TV and mobile viewing."


class FakeParsedResponse:
    def __init__(self, payload: AIExtractionPayload) -> None:
        self.output_text = payload.model_dump_json()
        self.output = []


class FakeResponsesClient:
    def __init__(self, payload: AIExtractionPayload) -> None:
        self.payload = payload
        self.calls: list[dict] = []

    async def create(self, **kwargs):
        self.calls.append(kwargs)
        return FakeParsedResponse(self.payload)


class FakeOpenAIClient:
    def __init__(self, payload: AIExtractionPayload) -> None:
        self.responses = FakeResponsesClient(payload)


@contextmanager
def configured_ai_env():
    original_key = os.environ.get("OPENAI_API_KEY")
    original_model = os.environ.get("OPENAI_MODEL")
    os.environ["OPENAI_API_KEY"] = "test-key"
    os.environ["OPENAI_MODEL"] = "gpt-5.4-mini"
    get_settings.cache_clear()

    try:
        yield
    finally:
        if original_key is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = original_key

        if original_model is None:
            os.environ.pop("OPENAI_MODEL", None)
        else:
            os.environ["OPENAI_MODEL"] = original_model
        get_settings.cache_clear()


def test_extracts_expected_requirements_from_example_message():
    with configured_ai_env():
        extractor = ConversationExtractor()
        fake_client = FakeOpenAIClient(
            AIExtractionPayload(
                extracted_requirements=AIExtractedRequirements(
                    project_type="hotel",
                    subscribers_or_rooms=180,
                    number_of_channels=85,
                    signal_sources=["satellite", "ip_streams"],
                    services=["catchup_tv"],
                    viewer_devices=["smart_tv", "mobile"],
                ),
                next_question="What type of project is this?",
            )
        )
        extractor.client = fake_client

        result = asyncio.run(extractor.extract(EXAMPLE_MESSAGE, PartialCustomerRequirements()))

        assert result.ai_available is True
        assert result.extraction_succeeded is True
        assert result.extracted_requirements.project_type == "hotel"
        assert result.extracted_requirements.subscribers_or_rooms == 180
        assert result.extracted_requirements.number_of_channels == 85
        assert "satellite" in result.extracted_requirements.signal_sources
        assert "ip_streams" in result.extracted_requirements.signal_sources
        assert "catchup_tv" in result.extracted_requirements.services
        assert "smart_tv" in result.extracted_requirements.viewer_devices
        assert "mobile" in result.extracted_requirements.viewer_devices
        assert result.next_question == "Will delivery stay on a local network, go over OTT/internet, or both?"
        assert "project type" not in (result.next_question or "").lower()
        assert fake_client.responses.calls[0]["model"] == "gpt-5.4-mini"


def test_merges_with_existing_requirements_without_overwriting_known_values():
    with configured_ai_env():
        extractor = ConversationExtractor()
        fake_client = FakeOpenAIClient(
            AIExtractionPayload(
                extracted_requirements=AIExtractedRequirements(
                    project_type="hotel",
                    signal_sources=["satellite", "ip_streams"],
                    viewer_devices=["smart_tv", "mobile"],
                )
            )
        )
        extractor.client = fake_client

        current = PartialCustomerRequirements(
            project_type="hotel",
            subscribers_or_rooms=180,
            signal_sources=["satellite"],
            viewer_devices=["smart_tv"],
        )

        result = asyncio.run(extractor.extract(EXAMPLE_MESSAGE, current))

        assert result.extracted_requirements.subscribers_or_rooms == 180
        assert result.extracted_requirements.signal_sources == ["satellite", "ip_streams"]
        assert result.extracted_requirements.viewer_devices == ["smart_tv", "mobile"]
