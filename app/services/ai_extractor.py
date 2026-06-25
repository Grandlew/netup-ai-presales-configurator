from __future__ import annotations

import logging
from collections.abc import Iterable
from typing import Any

from pydantic import ValidationError

from app.schemas import AIExtractionPayload, ConversationExtractResponse, PartialCustomerRequirements
from app.services.requirements import missing_required_fields, next_question_for
from app.settings import get_settings

try:
    from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI, AuthenticationError, RateLimitError

    OPENAI_SDK_AVAILABLE = True
except ModuleNotFoundError:  # pragma: no cover - exercised in runtime environments without the SDK
    AsyncOpenAI = None
    OPENAI_SDK_AVAILABLE = False

    class APIConnectionError(Exception):
        pass

    class APIStatusError(Exception):
        pass

    class APITimeoutError(Exception):
        pass

    class AuthenticationError(Exception):
        pass

    class RateLimitError(Exception):
        pass


logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """
Extract only customer requirements that are explicitly stated for the NetUP presales configurator.

Rules:
- Normalize values to the supported enum values when they are clearly stated.
- Never invent or assume missing values.
- Leave uncertain fields null or empty.
- Do not recommend products.
- Do not calculate bandwidth, storage, or architecture.
- Capture only the supported requirement fields.
- Generate at most one concise follow-up question when more required information is needed.
""".strip()


class ConversationExtractor:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = (
            AsyncOpenAI(
                api_key=self.settings.openai_api_key,
                timeout=30.0,
                max_retries=0,
            )
            if self.settings.openai_api_key
            else None
        )

    @property
    def enabled(self) -> bool:
        return bool(self.settings.openai_api_key) and OPENAI_SDK_AVAILABLE

    def _safe_log_context(self, message: str, current: PartialCustomerRequirements) -> dict[str, Any]:
        context: dict[str, Any] = {
            "model": self.settings.openai_model,
            "api_key_present": bool(self.settings.openai_api_key),
            "message_length": len(message),
            "current_fields_present": sorted(current.model_dump(exclude_none=True).keys()),
        }
        if self.settings.environment != "production":
            context["message_preview"] = message[:160]
        return context

    def _response(
        self,
        *,
        current: PartialCustomerRequirements,
        ai_available: bool,
        extraction_succeeded: bool,
        error_code: str | None = None,
        message: str | None = None,
    ) -> ConversationExtractResponse:
        missing = missing_required_fields(current)
        next_question = next_question_for(current) if extraction_succeeded else None
        return ConversationExtractResponse(
            extracted_requirements=current,
            missing_required_fields=missing,
            next_question=next_question,
            ready_for_recommendation=extraction_succeeded and not missing,
            ai_available=ai_available,
            extraction_succeeded=extraction_succeeded,
            error_code=error_code,
            message=message,
        )

    def _merge_lists(self, current_value: Iterable[Any], extracted_value: Iterable[Any]) -> list[Any]:
        merged: list[Any] = []
        for item in [*current_value, *extracted_value]:
            if item not in merged:
                merged.append(item)
        return merged

    def _merge_requirements(
        self,
        current: PartialCustomerRequirements,
        extracted: PartialCustomerRequirements,
    ) -> PartialCustomerRequirements:
        merged: dict[str, Any] = current.model_dump(mode="json")
        extracted_data = extracted.model_dump(mode="json")

        for field_name, extracted_value in extracted_data.items():
            current_value = merged.get(field_name)

            if extracted_value in (None, "", [], {}):
                continue

            if isinstance(extracted_value, list):
                merged[field_name] = self._merge_lists(current_value or [], extracted_value)
                continue

            if isinstance(extracted_value, dict):
                merged[field_name] = {
                    **(current_value or {}),
                    **extracted_value,
                }
                continue

            if current_value in (None, ""):
                merged[field_name] = extracted_value

        return PartialCustomerRequirements.model_validate(merged)

    def _error_response(
        self,
        *,
        current: PartialCustomerRequirements,
        ai_available: bool,
        error_code: str,
        message: str,
    ) -> ConversationExtractResponse:
        return self._response(
            current=current,
            ai_available=ai_available,
            extraction_succeeded=False,
            error_code=error_code,
            message=message,
        )

    def _log_openai_failure(self, exc: Exception, *, message: str, current: PartialCustomerRequirements, error_code: str) -> None:
        response = getattr(exc, "response", None)
        body = getattr(exc, "body", None)
        request_id = getattr(exc, "request_id", None)
        if request_id is None and response is not None:
            request_id = response.headers.get("x-request-id")

        openai_error_code = None
        if isinstance(body, dict):
            error_payload = body.get("error")
            if isinstance(error_payload, dict):
                openai_error_code = error_payload.get("code")

        safe_context = {
            **self._safe_log_context(message, current),
            "exception_class": exc.__class__.__name__,
            "http_status": getattr(exc, "status_code", None),
            "openai_error_code": openai_error_code,
            "request_id": request_id,
            "error_code": error_code,
        }
        logger.exception("AI extraction request failed: %s", safe_context)

    async def extract(self, message: str, current: PartialCustomerRequirements | None) -> ConversationExtractResponse:
        if len(message) > self.settings.max_message_length:
            raise ValueError("Message is too long.")

        current = current or PartialCustomerRequirements()
        if not self.enabled:
            return self._error_response(
                current=current,
                ai_available=False,
                error_code="ai_not_configured",
                message=(
                    "Natural-language intake is currently unavailable because the AI service is not configured."
                    if not self.settings.openai_api_key
                    else "Natural-language intake is currently unavailable because the AI client dependency is not installed on the server."
                ),
            )

        try:
            parsed = await self.client.responses.parse(
                model=self.settings.openai_model,
                instructions=SYSTEM_PROMPT,
                input=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": (
                                    "Extract supported requirements from the customer message. "
                                    "Preserve current known values and do not invent missing information.\n\n"
                                    f"Customer message:\n{message}\n\n"
                                    f"Current known requirements:\n{current.model_dump_json(indent=2)}"
                                ),
                            }
                        ],
                    }
                ],
                text_format=AIExtractionPayload,
            )
            parsed_payload = parsed.output_parsed
            if parsed_payload is None:
                raise ValueError("AI extraction did not return structured output.")

            extracted = PartialCustomerRequirements.model_validate(
                parsed_payload.extracted_requirements.model_dump(mode="json")
            )
            merged = self._merge_requirements(current, extracted)
        except AuthenticationError as exc:
            self._log_openai_failure(exc, message=message, current=current, error_code="openai_authentication_failed")
            return self._error_response(
                current=current,
                ai_available=True,
                error_code="openai_authentication_failed",
                message="The AI service could not authenticate. Please contact the administrator.",
            )
        except RateLimitError as exc:
            body = getattr(exc, "body", None)
            error_payload = body.get("error") if isinstance(body, dict) else {}
            openai_error_code = error_payload.get("code") if isinstance(error_payload, dict) else None
            error_code = "openai_insufficient_quota" if openai_error_code == "insufficient_quota" else "openai_rate_limited"
            self._log_openai_failure(exc, message=message, current=current, error_code=error_code)
            return self._error_response(
                current=current,
                ai_available=True,
                error_code=error_code,
                message=(
                    "The AI service has reached its usage limit. Please use the guided configurator."
                    if error_code == "openai_insufficient_quota"
                    else "The AI service is busy right now. Please try again in a moment."
                ),
            )
        except APITimeoutError as exc:
            self._log_openai_failure(exc, message=message, current=current, error_code="openai_timeout")
            return self._error_response(
                current=current,
                ai_available=True,
                error_code="openai_timeout",
                message="The extraction request timed out. Please try again.",
            )
        except APIConnectionError as exc:
            self._log_openai_failure(exc, message=message, current=current, error_code="openai_network_error")
            return self._error_response(
                current=current,
                ai_available=True,
                error_code="openai_network_error",
                message="The AI service could not be reached right now. Please try again.",
            )
        except APIStatusError as exc:
            body = getattr(exc, "body", None)
            error_payload = body.get("error") if isinstance(body, dict) else {}
            openai_error_code = error_payload.get("code") if isinstance(error_payload, dict) else None
            error_code = "openai_model_unavailable" if openai_error_code in {"model_not_found", "unsupported_model"} else "openai_request_failed"
            self._log_openai_failure(exc, message=message, current=current, error_code=error_code)
            return self._error_response(
                current=current,
                ai_available=True,
                error_code=error_code,
                message=(
                    "The configured AI model is unavailable for this account. Please contact the administrator."
                    if error_code == "openai_model_unavailable"
                    else "We could not extract the project requirements. Please try again."
                ),
            )
        except (ValidationError, ValueError) as exc:
            logger.exception(
                "AI extraction returned invalid structured output: %s",
                {
                    **self._safe_log_context(message, current),
                    "exception_class": exc.__class__.__name__,
                    "error_code": "invalid_structured_response",
                },
            )
            return self._error_response(
                current=current,
                ai_available=True,
                error_code="invalid_structured_response",
                message="The AI service returned an invalid extraction format. Please try again.",
            )
        except Exception as exc:
            logger.exception(
                "Unexpected AI extraction failure: %s",
                {
                    **self._safe_log_context(message, current),
                    "exception_class": exc.__class__.__name__,
                    "error_code": "unexpected_server_error",
                },
            )
            return self._error_response(
                current=current,
                ai_available=True,
                error_code="unexpected_server_error",
                message="We could not extract the project requirements. Please try again.",
            )

        return self._response(
            current=merged,
            ai_available=True,
            extraction_succeeded=True,
        )
