from __future__ import annotations

from datetime import UTC, datetime
import html
import re
from textwrap import wrap

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
    text_lines = _html_to_text_lines(report_html)
    return _build_simple_pdf(text_lines)


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
      wrapped = wrap(stripped, width=90) or [""]
      lines.extend(wrapped)

    return lines


def _build_simple_pdf(lines: list[str]) -> bytes:
    max_lines_per_page = 46
    pages = [lines[index:index + max_lines_per_page] for index in range(0, len(lines), max_lines_per_page)] or [[]]
    objects: list[bytes] = []

    def add_object(content: bytes) -> int:
        objects.append(content)
        return len(objects)

    font_id = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    page_ids: list[int] = []
    content_ids: list[int] = []
    pages_id_placeholder = len(objects) + 1

    for page_lines in pages:
        content_stream = _page_stream(page_lines)
        content_id = add_object(
            f"<< /Length {len(content_stream)} >>\nstream\n".encode("ascii")
            + content_stream
            + b"\nendstream"
        )
        content_ids.append(content_id)
        page_id = add_object(b"")
        page_ids.append(page_id)

    pages_kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    pages_id = add_object(f"<< /Type /Pages /Kids [{pages_kids}] /Count {len(page_ids)} >>".encode("ascii"))

    for page_id, content_id in zip(page_ids, content_ids, strict=True):
        objects[page_id - 1] = (
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        ).encode("ascii")

    catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("ascii"))

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode("ascii")
    )
    return bytes(pdf)


def _page_stream(lines: list[str]) -> bytes:
    y_position = 756
    commands = ["BT", "/F1 11 Tf", "50 756 Td", "14 TL"]
    first_line = True

    for line in lines:
        sanitized = _escape_pdf_text(line)
        if first_line:
            commands.append(f"({sanitized}) Tj")
            first_line = False
        else:
            commands.append("T*")
            commands.append(f"({sanitized}) Tj")
        y_position -= 14

    commands.append("ET")
    return "\n".join(commands).encode("latin-1", errors="replace")


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
