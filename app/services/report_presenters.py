from __future__ import annotations

from datetime import UTC, datetime
import html
import re

from app.schemas import CustomerRequirements, RecommendationResponse

ENUM_LABELS = {
    "hotel": "Hotel",
    "hospital": "Hospital",
    "university": "University",
    "residential_complex": "Residential complex",
    "small_provider": "Small IPTV / OTT provider",
    "large_operator": "Large IPTV / OTT operator",
    "cable_operator": "Cable operator",
    "transport": "Transport",
    "other": "Other",
    "both": "Local network and Internet / OTT",
    "local_network": "Local network",
    "internet_ott": "Internet / OTT",
    "live_tv": "Live TV",
    "epg": "EPG",
    "catchup_tv": "Catch-up TV",
    "time_shift": "Time-shift",
    "video_on_demand": "Video on demand",
    "billing": "Billing",
    "advertising": "Advertising",
    "own_tv_channel": "Own TV channel",
    "smart_tv": "Smart TV",
    "set_top_box": "Set-top box",
    "mobile": "Mobile",
    "web_browser": "Web browser",
    "ip_streams": "Existing IP streams",
    "satellite": "Satellite",
    "terrestrial": "Terrestrial",
    "cable": "Cable",
    "asi": "ASI",
    "hdmi_sdi": "HDMI / SDI",
    "ip": "IP",
    "dvb_c_qam": "DVB-C / QAM",
    "hotel_wifi_only": "Hotel Wi-Fi only",
    "off_property_access": "Outside the property",
    "staff_internal_only": "Staff/internal only",
    "managed_lan_multicast": "Managed LAN multicast",
    "managed_lan_unicast": "Managed LAN unicast",
    "coaxial_dvb_c": "Coaxial / DVB-C",
    "ethernet": "Ethernet",
    "wifi": "Wi-Fi",
    "coaxial": "Coaxial cable",
    "hybrid": "Hybrid network",
    "confirmed": "Confirmed",
    "calculated": "Calculated",
    "inferred": "Inferred",
    "conditional": "Conditional",
    "unknown": "Unknown",
    "provisional": "Provisional",
}


def format_enum_label(value: str) -> str:
    if value in ENUM_LABELS:
        return ENUM_LABELS[value]
    return " ".join(segment.capitalize() for segment in re.split(r"[_-]+", value) if segment)


def format_rule_version(rule_version: str) -> str:
    match = re.search(r"\d{4}\.\d{2}", rule_version)
    return match.group(0) if match else rule_version


def format_number(value: float | int, maximum_fraction_digits: int = 2) -> str:
    if maximum_fraction_digits == 0:
        return f"{int(round(float(value))):,}"
    numeric = float(value)
    if numeric.is_integer():
        return f"{int(numeric):,}"
    return f"{numeric:,.{maximum_fraction_digits}f}".rstrip("0").rstrip(".")


def build_reference_number(recommendation: RecommendationResponse, requirements: CustomerRequirements) -> str:
    source = "|".join(
        filter(
            None,
            [
                recommendation.rule_version,
                recommendation.project_summary,
                requirements.project_type.value if requirements.project_type else None,
                str(requirements.subscribers_or_rooms) if requirements.subscribers_or_rooms else None,
            ],
        )
    )
    hash_value = 0
    for char in source:
        hash_value = (hash_value * 31 + ord(char)) % 100000
    date_part = datetime.now(UTC).strftime("%Y%m%d")
    return f"REC-{date_part}-{hash_value:05d}"


def build_project_title(requirements: CustomerRequirements, recommendation: RecommendationResponse) -> str:
    if not requirements.project_type or not requirements.subscribers_or_rooms:
        return recommendation.project_summary

    scale_label = "rooms" if requirements.project_type.value == "hotel" else "subscribers"
    parts = [f"{format_enum_label(requirements.project_type.value)} solution for {format_number(requirements.subscribers_or_rooms, 0)} {scale_label}"]
    if requirements.number_of_channels:
        parts.append(f"{format_number(requirements.number_of_channels, 0)} channels")
    if requirements.delivery_mode:
        parts.append(f"with {format_enum_label(requirements.delivery_mode.value)} delivery")
    return ", ".join(parts)


def get_matched_conditions(requirements: CustomerRequirements, recommendation_item) -> list[tuple[str, str]]:
    conditions: list[tuple[str, str]] = []
    if requirements.project_type:
        conditions.append(("Project type", format_enum_label(requirements.project_type.value)))
    if requirements.subscribers_or_rooms:
        scale_label = "rooms" if requirements.project_type and requirements.project_type.value == "hotel" else "subscribers"
        conditions.append(("Project scale", f"{format_number(requirements.subscribers_or_rooms, 0)} {scale_label}"))
    if requirements.number_of_channels:
        conditions.append(("Channel count", f"{format_number(requirements.number_of_channels, 0)} TV channels"))
    if requirements.delivery_mode:
        conditions.append(("Delivery mode", format_enum_label(requirements.delivery_mode.value)))
    if requirements.services:
        label = "Selected service" if len(requirements.services) == 1 else "Selected services"
        conditions.append((label, ", ".join(format_enum_label(item.value) for item in requirements.services)))
    if requirements.viewer_devices:
        conditions.append(("Selected devices", ", ".join(format_enum_label(item.value) for item in requirements.viewer_devices)))
    if requirements.signal_sources:
        conditions.append(("Signal sources", ", ".join(format_enum_label(item.value) for item in requirements.signal_sources)))
    if requirements.output_type and requirements.output_type.value != "ip":
        conditions.append(("Output type", format_enum_label(requirements.output_type.value)))
    if requirements.adaptive_bitrate_required:
        conditions.append(("Adaptive bitrate", "Required"))
    if requirements.hotel_tv_brand:
        conditions.append(("Hotel TV brand", requirements.hotel_tv_brand))
    if requirements.hotel_tv_model:
        conditions.append(("Hotel TV model", requirements.hotel_tv_model))
    if requirements.mobile_viewing_scope:
        conditions.append(("Mobile scope", format_enum_label(requirements.mobile_viewing_scope.value)))
    return conditions


def get_visible_product_warning(warning: str | None) -> str | None:
    if not warning:
        return None
    normalized = warning.strip().lower().rstrip(".")
    if normalized == "requires netup validation":
        return None
    return warning


def get_architecture_stages(requirements: CustomerRequirements, recommendation: RecommendationResponse) -> list[tuple[str, list[str]]]:
    if recommendation.recommended_architecture and recommendation.recommended_architecture.branches:
        stages: list[tuple[str, list[str]]] = []
        for branch in recommendation.recommended_architecture.branches:
            stages.append((branch.name, [node.label for node in branch.nodes]))
        return stages

    stages: list[tuple[str, list[str]]] = []
    if requirements.signal_sources:
        stages.append(("Signal sources", [format_enum_label(item.value) for item in requirements.signal_sources]))

    product_groups = [
        ("Headend", lambda item: item.category.lower() == "headend" or item.category.lower() == "encoding" or "streamer" in item.product.lower()),
        ("Core platform", lambda item: "core" in item.category.lower()),
        ("Media processing", lambda item: "media processing" in item.category.lower() or "processor" in item.product.lower()),
        ("Output layer", lambda item: "qam output" in item.category.lower() or "qam" in item.product.lower()),
    ]

    for label, matcher in product_groups:
        matched = []
        for item in recommendation.recommendations:
            if matcher(item) and item.product not in matched:
                matched.append(item.product)
        if matched:
            stages.append((label, matched))

    if requirements.delivery_mode:
        if requirements.delivery_mode.value == "both":
            stages.append(("Delivery", ["Local network distribution", "Internet / OTT delivery"]))
        elif requirements.delivery_mode.value == "internet_ott":
            stages.append(("Delivery", ["Internet / OTT delivery"]))
        else:
            stages.append(("Delivery", ["Local network distribution"]))

    if requirements.viewer_devices:
        stages.append(("Viewer devices", [format_enum_label(item.value) for item in requirements.viewer_devices]))

    return stages


def parse_bandwidth_formula(formula: str, final_bandwidth: float) -> list[str]:
    segments = [segment.strip() for segment in re.split(r"\sx\s", formula) if segment.strip()]
    segments.append(f"= {format_number(final_bandwidth)} Mbps")
    return segments


def html_escape(value: str) -> str:
    return html.escape(value)
