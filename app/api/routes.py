from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Lead, Report
from app.dependencies import get_extractor
from app.schemas import (
    ConversationExtractRequest,
    ConversationExtractResponse,
    HealthResponse,
    LeadCreateRequest,
    LeadResponse,
    ProductCatalogItem,
    RecommendationResponse,
    ReportCreateRequest,
    ReportResponse,
    ConfigOptionsResponse,
    CustomerRequirements,
)
from app.services.ai_extractor import ConversationExtractor
from app.services.catalog import get_products
from app.services.options import get_options
from app.services.recommendation import recommend
from app.services.reports import render_report_doc, render_report_html, render_report_pdf
from app.settings import get_settings


api_router = APIRouter()
settings = get_settings()


@api_router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    db.execute(text("SELECT 1"))
    return HealthResponse(
        status="ok",
        database="ok",
        ai_extraction="enabled" if settings.openai_api_key else "disabled",
    )


@api_router.post("/recommend", response_model=RecommendationResponse)
def create_recommendation(requirements: CustomerRequirements) -> RecommendationResponse:
    return recommend(requirements)


@api_router.post("/api/conversation/extract", response_model=ConversationExtractResponse)
async def conversation_extract(
    payload: ConversationExtractRequest,
    extractor: ConversationExtractor = Depends(get_extractor),
) -> ConversationExtractResponse:
    try:
        return await extractor.extract(payload.message, payload.current_requirements)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@api_router.get("/api/products", response_model=list[ProductCatalogItem])
def products() -> list[ProductCatalogItem]:
    return get_products()


@api_router.get("/api/config/options", response_model=ConfigOptionsResponse)
def config_options() -> ConfigOptionsResponse:
    return get_options()


@api_router.post("/api/leads", response_model=LeadResponse)
def create_lead(payload: LeadCreateRequest, db: Session = Depends(get_db)) -> LeadResponse:
    lead = Lead(
        contact_name=payload.contact_name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        country=payload.country,
        project_type=payload.project_type.value if payload.project_type else None,
        requirements_json=payload.requirements.model_dump(mode="json"),
        recommendation_json=payload.recommendation.model_dump(mode="json"),
        source=payload.source,
        consent_given=payload.consent_given,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return LeadResponse(
        id=lead.id,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        status=lead.status,
        contact_name=lead.contact_name,
        email=lead.email,
        phone=lead.phone,
        company=lead.company,
        country=lead.country,
        project_type=lead.project_type,
        source=lead.source,
        consent_given=lead.consent_given,
        requirements=lead.requirements_json,
        recommendation=lead.recommendation_json,
    )


@api_router.get("/api/leads/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: str, db: Session = Depends(get_db)) -> LeadResponse:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return LeadResponse(
        id=lead.id,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        status=lead.status,
        contact_name=lead.contact_name,
        email=lead.email,
        phone=lead.phone,
        company=lead.company,
        country=lead.country,
        project_type=lead.project_type,
        source=lead.source,
        consent_given=lead.consent_given,
        requirements=lead.requirements_json,
        recommendation=lead.recommendation_json,
    )


@api_router.post("/api/reports", response_model=ReportResponse)
def create_report(payload: ReportCreateRequest, db: Session = Depends(get_db)) -> ReportResponse:
    lead = db.get(Lead, payload.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    content = render_report_html(payload.lead_id, payload.requirements, payload.recommendation)
    report = Report(lead_id=payload.lead_id, generated_content=content)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@api_router.get("/api/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)) -> ReportResponse:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


@api_router.get("/api/reports/{report_id}/download")
def download_report(
    report_id: str,
    format: str = Query(pattern="^(pdf|doc)$"),
    db: Session = Depends(get_db),
) -> Response:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if format == "pdf":
        content = render_report_pdf(report.generated_content)
        media_type = "application/pdf"
        filename = f"netup-preliminary-report-{report_id}.pdf"
    else:
        content = render_report_doc(report.generated_content)
        media_type = "application/msword"
        filename = f"netup-preliminary-report-{report_id}.doc"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
