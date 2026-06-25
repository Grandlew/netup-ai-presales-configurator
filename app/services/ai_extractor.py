from __future__ import annotations

import json

import httpx
from pydantic import ValidationError

from app.schemas import ConversationExtractResponse, PartialCustomerRequirements
from app.services.requirements import missing_required_fields, next_question_for
from app.settings import get_settings


class ConversationExtractor:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self.settings.openai_api_key)

    async def extract(self, message: str, current: PartialCustomerRequirements | None) -> ConversationExtractResponse:
        if len(message) > self.settings.max_message_length:
            raise ValueError("Message is too long.")

        current = current or PartialCustomerRequirements()
        if not self.enabled:
            merged = current
            missing = missing_required_fields(merged)
            return ConversationExtractResponse(
                extracted_requirements=merged,
                missing_required_fields=missing,
                next_question=next_question_for(merged),
                ready_for_recommendation=not missing,
                ai_available=False,
            )

        payload = {
            "model": self.settings.openai_model,
            "input": [
                {
                    "role": "system",
                    "content": (
                        "Extract only explicitly supported NetUP presales requirement fields. "
                        "Leave uncertain values null. Do not recommend products, pricing, or capacity. "
                        "Return one concise follow-up question only when needed."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "message": message,
                            "current_requirements": current.model_dump(mode="json"),
                        }
                    ),
                },
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "netup_extraction",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "extracted_requirements": PartialCustomerRequirements.model_json_schema(),
                            "next_question": {"type": ["string", "null"]},
                        },
                        "required": ["extracted_requirements", "next_question"],
                    },
                }
            },
        }
        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post("https://api.openai.com/v1/responses", headers=headers, json=payload)
            response.raise_for_status()
            body = response.json()

        output_text = body.get("output_text")
        if not output_text:
            for item in body.get("output", []):
                for content in item.get("content", []):
                    if content.get("type") == "output_text":
                        output_text = content.get("text")
                        break
                if output_text:
                    break
        if not output_text:
            raise ValueError("AI extraction did not return structured output.")

        data = json.loads(output_text)
        try:
            extracted = PartialCustomerRequirements.model_validate(data["extracted_requirements"])
        except ValidationError as exc:
            raise ValueError("AI extraction response failed validation.") from exc

        merged_dict = current.model_dump(exclude_none=True)
        merged_dict.update(extracted.model_dump(exclude_none=True))
        merged = PartialCustomerRequirements.model_validate(merged_dict)
        missing = missing_required_fields(merged)
        next_question = data.get("next_question") or next_question_for(merged)
        return ConversationExtractResponse(
            extracted_requirements=merged,
            missing_required_fields=missing,
            next_question=next_question,
            ready_for_recommendation=not missing,
            ai_available=True,
        )

