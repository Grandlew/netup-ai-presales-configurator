from __future__ import annotations

from datetime import UTC, datetime
import html

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
