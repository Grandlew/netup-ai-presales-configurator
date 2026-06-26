from __future__ import annotations

import io
import re
from datetime import UTC, datetime
from textwrap import wrap

from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from app.schemas import CustomerRequirements, RecommendationResponse
from app.services.report_presenters import (
    build_project_title,
    build_reference_number,
    format_enum_label,
    format_number,
    format_rule_version,
    get_architecture_stages,
    get_matched_conditions,
    get_visible_product_warning,
    html_escape,
    parse_bandwidth_formula,
)


def render_report_html(lead_id: str, requirements: CustomerRequirements, recommendation: RecommendationResponse) -> str:
    del lead_id

    reference_number = build_reference_number(recommendation, requirements)
    architecture_stages = get_architecture_stages(requirements, recommendation)
    formula_rows = "".join(f"<li>{html_escape(item)}</li>" for item in parse_bandwidth_formula(recommendation.capacity.unicast_bandwidth_formula, recommendation.capacity.safety_adjusted_bandwidth_mbps))
    selected_requirements = [
        ("Company", requirements.company or "Not specified"),
        ("Contact", requirements.contact_name or "Not specified"),
        ("Project type", format_enum_label(requirements.project_type.value)),
        ("Country", requirements.country or "Not specified"),
        ("Rooms or endpoints", format_number(requirements.subscribers_or_rooms, 0)),
        ("TV channels", format_number(requirements.number_of_channels, 0)),
        ("Signal sources", ", ".join(format_enum_label(item.value) for item in requirements.signal_sources)),
        ("Required services", ", ".join(format_enum_label(item.value) for item in requirements.services)),
        ("Viewer devices", ", ".join(format_enum_label(item.value) for item in requirements.viewer_devices)),
        ("Delivery mode", format_enum_label(requirements.delivery_mode.value)),
    ]
    if requirements.hotel_tv_brand:
        selected_requirements.append(("Hotel TV brand", requirements.hotel_tv_brand))
    if requirements.hotel_tv_model:
        selected_requirements.append(("Hotel TV model", requirements.hotel_tv_model))
    if requirements.mobile_viewing_scope:
        selected_requirements.append(("Mobile scope", format_enum_label(requirements.mobile_viewing_scope.value)))
    summary_rows = "".join(
        f"<div class='summary-card'><dt>{html_escape(label)}</dt><dd>{html_escape(value)}</dd></div>"
        for label, value in selected_requirements
    )
    architecture_html = "".join(
        (
            "<div class='architecture-node'>"
            f"<p class='node-label'>{html_escape(label)}</p>"
            f"<p class='node-value'>{html_escape(', '.join(items))}</p>"
            "</div>"
        )
        + ("<div class='architecture-arrow' aria-hidden='true'>&rarr;</div>" if index < len(architecture_stages) - 1 else "")
        for index, (label, items) in enumerate(architecture_stages)
    )
    product_cards = "".join(
        _render_product_card(item, requirements)
        for item in recommendation.recommendations
    )
    assumptions = "".join(f"<li>{html_escape(item)}</li>" for item in recommendation.assumptions)
    missing_items = recommendation.missing_information or ["No major gaps detected in the submitted project profile."]
    missing = "".join(f"<li>{html_escape(item)}</li>" for item in missing_items)
    warnings = "".join(f"<li>{html_escape(item)}</li>" for item in recommendation.warnings)
    claims = "".join(
        f"<li><strong>{html_escape(format_enum_label(statement.status.value))}:</strong> {html_escape(statement.claim)}"
        + (f"<br /><span style='color:#4c5e77'>{html_escape(statement.notes)}</span>" if statement.notes else "")
        + "</li>"
        for statement in recommendation.claim_statements
    )
    references = "".join(
        f"<li><strong>{html_escape(reference.title)}</strong><br />{html_escape(reference.extracted_capability)}<br />{html_escape(reference.url)}</li>"
        for reference in recommendation.official_references
    )
    alternative_architectures = "".join(
        f"<li><strong>{html_escape(option.name)}</strong>: {html_escape(option.reason)}</li>"
        for option in recommendation.alternative_architectures
    )
    next_steps = "".join(
        f"<li>{html_escape(step)}</li>"
        for step in [
            "Review the preliminary recommendation.",
            "Confirm unresolved technical and commercial requirements.",
            "Submit the project for NetUP engineering validation.",
            "Receive the final architecture, licensing scope, and quotation.",
        ]
    )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NetUP Preliminary Solution Recommendation</title>
  <style>
    @page {{ margin: 20mm 16mm; }}
    body {{ font-family: Arial, sans-serif; color: #10233d; margin: 0; line-height: 1.5; background: #ffffff; }}
    .report {{ max-width: 1080px; margin: 0 auto; }}
    h1, h2, h3 {{ color: #10233d; margin: 0; }}
    .eyebrow {{ text-transform: uppercase; letter-spacing: 0.16em; color: #2d5b91; font-size: 12px; font-weight: 700; }}
    .section {{ margin-top: 22px; border: 1px solid #d7e1ef; border-radius: 24px; padding: 20px; background: #ffffff; page-break-inside: avoid; }}
    .hero {{ padding: 24px; }}
    .badge-row {{ display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }}
    .badge {{ display: inline-flex; align-items: center; border-radius: 999px; background: #edf4ff; color: #2d5b91; padding: 4px 10px; font-size: 12px; font-weight: 700; }}
    .meta {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 18px; background: #f6f9fc; border-radius: 20px; padding: 16px; }}
    .meta dt, .summary-card dt {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #5b6f88; font-weight: 700; }}
    .meta dd, .summary-card dd {{ margin: 6px 0 0; font-size: 14px; color: #10233d; font-weight: 600; }}
    .summary-grid {{ display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }}
    .summary-card {{ border-radius: 18px; background: #f6f9fc; padding: 14px; }}
    .architecture-wrap {{ margin-top: 16px; }}
    .architecture-sequence {{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }}
    .architecture-node {{ min-width: 165px; flex: 1 1 165px; border: 1px solid #d7e1ef; border-radius: 18px; padding: 14px; background: #ffffff; }}
    .architecture-arrow {{ color: #2d5b91; font-size: 20px; font-weight: 700; }}
    .node-label {{ margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #5b6f88; font-weight: 700; }}
    .node-value {{ margin: 0; font-size: 14px; color: #10233d; font-weight: 600; }}
    .note {{ margin-top: 12px; padding: 12px 14px; border-radius: 16px; background: #f6f9fc; font-size: 13px; color: #3c5067; }}
    .product-list {{ display: grid; gap: 14px; margin-top: 16px; }}
    .product-card {{ border: 1px solid #d7e1ef; border-radius: 20px; padding: 16px; background: #ffffff; }}
    .product-top {{ display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }}
    .product-title {{ font-size: 20px; font-weight: 700; margin-top: 4px; }}
    .product-category {{ font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #2d5b91; font-weight: 700; }}
    .product-badges {{ display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }}
    .product-reason {{ margin: 12px 0 0; font-size: 14px; color: #26384d; }}
    .conditions {{ margin-top: 14px; border-top: 1px solid #e5edf7; padding-top: 14px; }}
    .conditions h4 {{ font-size: 14px; margin-bottom: 10px; }}
    .condition-table {{ width: 100%; border-collapse: collapse; }}
    .condition-table th {{ width: 36%; text-align: left; font-size: 12px; color: #5b6f88; font-weight: 700; padding: 6px 0; vertical-align: top; }}
    .condition-table td {{ font-size: 13px; color: #10233d; padding: 6px 0; }}
    .warning-chip {{ margin-top: 12px; border-radius: 16px; background: #fff7e7; padding: 10px 12px; font-size: 13px; color: #7a4a00; }}
    .capacity-grid {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }}
    .capacity-card {{ border-radius: 20px; background: #f6f9fc; padding: 16px; }}
    .capacity-card h4 {{ font-size: 14px; color: #5b6f88; margin: 0; }}
    .capacity-value {{ margin-top: 12px; font-size: 30px; font-weight: 700; white-space: nowrap; }}
    .capacity-sub {{ margin-top: 12px; border-top: 1px solid #d7e1ef; padding-top: 12px; font-size: 13px; color: #3c5067; }}
    .formula {{ margin-top: 16px; border-radius: 20px; border: 1px solid #d7e1ef; padding: 16px; }}
    .formula ul, .simple-list, .next-steps {{ margin: 12px 0 0; padding-left: 20px; }}
    .simple-list li, .next-steps li, .formula li {{ margin-bottom: 8px; }}
    .two-col {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }}
    .warnings {{ background: #fffaf0; }}
    .review-box {{ margin-top: 12px; border-top: 1px solid #e5edf7; padding-top: 12px; font-size: 13px; color: #3c5067; }}
    footer {{ margin-top: 24px; font-size: 12px; color: #4c5e77; border-top: 1px solid #d7e1ef; padding-top: 14px; }}
    @media print {{
      body {{ print-color-adjust: exact; -webkit-print-color-adjust: exact; }}
      .section, .product-card {{ break-inside: avoid; }}
    }}
  </style>
</head>
<body>
  <div class="report">
    <section class="section hero">
      <div class="badge-row">
        <p class="eyebrow">NetUP AI Presales Configurator</p>
        <span class="badge">Preliminary</span>
      </div>
      <h1 style="margin-top:10px; font-size: 30px;">Preliminary Solution Recommendation</h1>
      <p style="margin: 12px 0 0; font-size: 24px; font-weight: 700;">{html_escape(build_project_title(requirements, recommendation))}</p>
      <p style="margin: 12px 0 0; font-size: 15px; color: #3c5067;">This preliminary recommendation summarizes the current NetUP fit, estimated capacity, and the follow-up items needed before engineering validation.</p>
      <dl class="meta">
        <div><dt>Generated date</dt><dd>{datetime.now(UTC).strftime("%B %d, %Y")}</dd></div>
        <div><dt>Reference number</dt><dd>{html_escape(reference_number)}</dd></div>
        <div><dt>Recommendation rules version</dt><dd>{html_escape(format_rule_version(recommendation.rule_version))}</dd></div>
      </dl>
    </section>

    <section class="section">
      <h2 style="font-size: 22px;">Project summary</h2>
      <div class="summary-grid">{summary_rows}</div>
    </section>

    <section class="section">
      <h2 style="font-size: 22px;">Proposed solution architecture</h2>
      <div class="architecture-wrap">
        <div class="architecture-sequence">{architecture_html}</div>
        <p class="note">Preliminary architecture. Final interfaces, redundancy, capacity, licensing, and compatibility require NetUP engineering validation.</p>
      </div>
    </section>

    <section class="section">
      <h2 style="font-size: 22px;">Recommended product families</h2>
      <div class="product-list">{product_cards}</div>
    </section>

    <section class="section">
      <h2 style="font-size: 22px;">Capacity estimates</h2>
      <div class="capacity-grid">
        <div class="capacity-card">
          <h4>Concurrent viewers</h4>
          <p class="capacity-value">{format_number(recommendation.capacity.assumed_concurrent_viewers, 0)}</p>
          <div class="capacity-sub">
            <strong>{'Customer-provided estimate' if requirements.expected_concurrent_viewers is not None else 'Estimated default'}</strong><br />
            {html_escape('Provided directly in the project profile.' if requirements.expected_concurrent_viewers is not None else 'Estimated from project scale because no direct value was supplied.')}
          </div>
        </div>
        <div class="capacity-card">
          <h4>Estimated bandwidth</h4>
          <p class="capacity-value">{format_number(recommendation.capacity.safety_adjusted_bandwidth_mbps)} Mbps</p>
          <div class="capacity-sub">
            <strong>Base estimate</strong><br />{format_number(recommendation.capacity.base_bandwidth_mbps)} Mbps<br /><br />
            <strong>Safety-adjusted</strong><br />{format_number(recommendation.capacity.safety_adjusted_bandwidth_mbps)} Mbps
          </div>
        </div>
        <div class="capacity-card">
          <h4>Estimated archive storage</h4>
          <p class="capacity-value">{'Pending input' if recommendation.capacity.storage_status.value == 'unknown' else 'Not required' if recommendation.capacity.safety_adjusted_archive_storage_tb == 0 else f"{format_number(recommendation.capacity.safety_adjusted_archive_storage_tb)} TB"}</p>
          <div class="capacity-sub">
            {html_escape(recommendation.capacity.storage_status_message or '') if recommendation.capacity.storage_status.value == 'unknown' else f"<strong>Base estimate</strong><br />{format_number(recommendation.capacity.estimated_archive_storage_tb)} TB<br /><br /><strong>Safety-adjusted</strong><br />{format_number(recommendation.capacity.safety_adjusted_archive_storage_tb)} TB"}
          </div>
        </div>
      </div>
      <div class="formula">
        <h3 style="font-size: 16px;">Formula and assumptions</h3>
        <ul>{formula_rows}</ul>
        <ul class="simple-list">
          <li>OTT unicast capacity scales with concurrent viewers.</li>
          <li>LAN multicast may use substantially less access bandwidth than unicast delivery.</li>
          <li>Multiple adaptive-bitrate renditions may increase origin, processing, and storage requirements.</li>
          <li>All estimates remain preliminary until NetUP engineering validation.</li>
        </ul>
      </div>
    </section>

    <section class="section two-col">
      <div>
        <h2 style="font-size: 22px;">Assumptions</h2>
        <ul class="simple-list">{assumptions}</ul>
      </div>
      <div>
        <h2 style="font-size: 22px;">Missing decision-critical information</h2>
        <ul class="simple-list">{missing}</ul>
      </div>
    </section>

    <section class="section warnings">
      <h2 style="font-size: 22px;">Engineering warnings</h2>
      <ul class="simple-list">{warnings}</ul>
    </section>

    <section class="section">
      <h2 style="font-size: 22px;">Claim status</h2>
      <ul class="simple-list">{claims}</ul>
    </section>

    {f'<section class="section"><h2 style="font-size: 22px;">Alternative architecture</h2><ul class="simple-list">{alternative_architectures}</ul></section>' if alternative_architectures else ''}

    <section class="section">
      <h2 style="font-size: 22px;">Official NetUP references</h2>
      <ul class="simple-list">{references}</ul>
    </section>

    <section class="section">
      <h2 style="font-size: 22px;">Next steps</h2>
      <ol class="next-steps">{next_steps}</ol>
      <div class="review-box">
        <strong>Engineering review</strong><br />
        Submit the validated project profile to NetUP engineering to confirm the final architecture, licensing scope, redundancy approach, compatibility, and quotation.
        <br /><br /><strong>Highest-priority follow-up question</strong><br />{html_escape(recommendation.next_question or 'NetUP engineering review is required to confirm the next unresolved item.')}
      </div>
    </section>

    <footer>
      Reference number: {html_escape(reference_number)}<br />
      This document is an automated preliminary presales recommendation and does not constitute a final technical design, quotation, licensing commitment, or compatibility guarantee. A NetUP engineer must validate the solution.
    </footer>
  </div>
</body>
</html>"""


def _render_product_card(item, requirements: CustomerRequirements) -> str:
    matched_conditions = "".join(
        f"<tr><th>{html_escape(label)}</th><td>{html_escape(value)}</td></tr>"
        for label, value in get_matched_conditions(requirements, item)
    )
    warning = get_visible_product_warning(item.warning)
    warning_html = f"<p class='warning-chip'>{html_escape(warning)}</p>" if warning else ""
    return f"""
    <article class="product-card">
      <div class="product-top">
        <div>
          <p class="product-category">{html_escape(item.category)}</p>
          <h3 class="product-title">{html_escape(item.product)}</h3>
          <p class="product-reason">{html_escape(item.reason)}</p>
        </div>
        <div class="product-badges">
          <span class="badge">Preliminary recommendation</span>
          <span class="badge">{html_escape(item.validation_status or 'Requires NetUP validation')}</span>
        </div>
      </div>
      {warning_html}
      <div class="conditions">
        <h4>Why this was selected</h4>
        <table class="condition-table">{matched_conditions}</table>
      </div>
    </article>
    """


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
    normalized = re.sub(r"<style\b[^>]*>.*?</style>", "", normalized, flags=re.IGNORECASE | re.DOTALL)
    normalized = re.sub(r"<script\b[^>]*>.*?</script>", "", normalized, flags=re.IGNORECASE | re.DOTALL)
    normalized = re.sub(r"<head\b[^>]*>.*?</head>", "", normalized, flags=re.IGNORECASE | re.DOTALL)
    normalized = re.sub(r"</(h1|h2|h3|h4|p|li|div|ul|ol|footer|tr)>", "\n", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"<li>", "- ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"<br\s*/?>", "\n", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"<[^>]+>", "", normalized)
    normalized = re.sub(r"&rarr;", "->", normalized)
    normalized = normalized.replace("&nbsp;", " ")

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
