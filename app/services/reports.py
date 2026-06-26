from __future__ import annotations

from datetime import UTC, datetime
import html
import io
import re
from textwrap import wrap

from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from app.schemas import CustomerRequirements, RecommendationResponse


def render_report_html(lead_id: str, requirements: CustomerRequirements, recommendation: RecommendationResponse) -> str:
    now = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    product_rows = "".join(
        f"<li><strong>{html.escape(item.product)}</strong>: {html.escape(item.reason)}</li>"
        for item in recommendation.recommendations
    )
    warnings = "".join(f"<li>{html.escape(item)}</li>" for item in recommendation.warnings)
    missing = "".join(f"<li>{html.escape(item)}</li>" for item in recommendation.missing_information) or "<li>None</li>"
    assumptions = "".join(f"<li>{html.escape(item)}</li>" for item in recommendation.assumptions)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NetUP Preliminary Solution Recommendation</title>
  <style>
    body {{ font-family: Arial, sans-serif; color: #10233d; margin: 40px; line-height: 1.5; }}
    h1, h2 {{ color: #0f2745; }}
    .notice {{ padding: 16px; border: 1px solid #c7d4e8; background: #f7faff; margin: 20px 0; }}
    .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }}
    .card {{ border: 1px solid #d5dfec; padding: 16px; border-radius: 10px; }}
    footer {{ margin-top: 28px; font-size: 12px; color: #4c5e77; }}
  </style>
</head>
<body>
  <h1>NetUP AI Presales Configurator</h1>
  <h2>Preliminary Solution Recommendation</h2>
  <p>Date: {now}</p>
  <p>Reference: {html.escape(lead_id)}</p>
  <div class="notice">
    This configurator provides a preliminary recommendation. Final equipment, licensing, capacity, compatibility, redundancy, and pricing must be validated by a NetUP engineer.
  </div>
  <div class="grid">
    <div class="card">
      <h3>Customer</h3>
      <p>{html.escape(requirements.contact_name or "Not provided")}</p>
      <p>{html.escape(requirements.company or requirements.company_name or "Not provided")}</p>
      <p>{html.escape(requirements.country or "Not provided")}</p>
    </div>
    <div class="card">
      <h3>Project Summary</h3>
      <p>{html.escape(recommendation.project_summary)}</p>
    </div>
  </div>
  <h3>Recommended Product Families</h3>
  <ul>{product_rows}</ul>
  <h3>Capacity Estimates</h3>
  <p>Bandwidth formula: {html.escape(recommendation.capacity.unicast_bandwidth_formula)}</p>
  <p>Base bandwidth: {recommendation.capacity.base_bandwidth_mbps} Mbps</p>
  <p>Safety-adjusted bandwidth: {recommendation.capacity.safety_adjusted_bandwidth_mbps} Mbps</p>
  <p>Base archive storage: {recommendation.capacity.estimated_archive_storage_tb} TB</p>
  <p>Safety-adjusted archive storage: {recommendation.capacity.safety_adjusted_archive_storage_tb} TB</p>
  <h3>Assumptions</h3>
  <ul>{assumptions}</ul>
  <h3>Missing Information</h3>
  <ul>{missing}</ul>
  <h3>Warnings</h3>
  <ul>{warnings}</ul>
  <footer>
    This document is an automated preliminary presales recommendation and does not constitute a final technical design, quotation, licensing commitment, or compatibility guarantee. A NetUP engineer must validate the solution.
  </footer>
</body>
</html>"""


def render_report_doc(report_html: str) -> bytes:
    return report_html.encode("utf-8")


def render_report_pdf(report_html: str) -> bytes:
    lines = _html_to_text_lines(report_html)
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    left_margin = 50
    top_margin = height - 50
    bottom_margin = 50
    line_height = 14
    y_position = top_margin

    pdf.setTitle("NetUP Preliminary Solution Recommendation")
    pdf.setAuthor("NetUP AI Presales Configurator")
    pdf.setFont("Helvetica", 11)

    for line in lines:
        if y_position <= bottom_margin:
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y_position = top_margin

        pdf.drawString(left_margin, y_position, _truncate_line_for_page(line, width - (left_margin * 2)))
        y_position -= line_height

    pdf.save()
    return buffer.getvalue()


def _html_to_text_lines(report_html: str) -> list[str]:
    normalized = report_html.replace("\r", "")
    normalized = re.sub(r"</(h1|h2|h3|p|li|div|ul|footer)>", "\n", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"<li>", "- ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"<br\s*/?>", "\n", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"<[^>]+>", "", normalized)
    normalized = html.unescape(normalized)
    normalized = normalized.replace("\u2019", "'").replace("\u00a0", " ")

    lines: list[str] = []
    for raw_line in normalized.splitlines():
        stripped = " ".join(raw_line.split())
        if not stripped:
            continue
        lines.extend(wrap(stripped, width=92) or [""])

    return lines


def _truncate_line_for_page(value: str, max_width: float) -> str:
    if stringWidth(value, "Helvetica", 11) <= max_width:
        return value

    truncated = value
    while truncated and stringWidth(f"{truncated}...", "Helvetica", 11) > max_width:
        truncated = truncated[:-1]
    return f"{truncated}..."
