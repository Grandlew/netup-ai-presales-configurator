from __future__ import annotations

from app.schemas import CapacityEstimate, CustomerRequirements, DeliveryMode, ProjectType, Service
from app.settings import get_settings


def estimate_capacity(req: CustomerRequirements) -> CapacityEstimate:
    settings = get_settings()
    concurrent = req.expected_concurrent_viewers
    assumptions: list[str] = []

    if concurrent is None:
        ratio = 0.60 if req.project_type in {
            ProjectType.HOTEL,
            ProjectType.HOSPITAL,
            ProjectType.UNIVERSITY,
            ProjectType.RESIDENTIAL,
        } else 0.30
        concurrent = max(1, round(req.subscribers_or_rooms * ratio))
        assumptions.append(
            f"Concurrent viewers were not supplied; estimated at {ratio:.0%} of subscribers/rooms."
        )

    base_bandwidth = concurrent * req.average_channel_bitrate_mbps
    overhead_factor = 1 + (settings.bandwidth_overhead_percent / 100)
    safety_factor = 1 + (settings.bandwidth_safety_margin_percent / 100)
    adjusted_bandwidth = base_bandwidth * overhead_factor * safety_factor

    archive_base = 0.0
    archive_adjusted = 0.0
    if req.archive_days > 0 and any(service in req.services for service in [Service.CATCHUP, Service.TIMESHIFT]):
        seconds = req.archive_days * 86_400
        recording_ratio = settings.archive_recording_ratio
        archive_base = (
            req.number_of_channels
            * req.average_channel_bitrate_mbps
            * recording_ratio
            * 1_000_000
            / 8
            * seconds
            / 1_000_000_000_000
        )
        archive_adjusted = archive_base
        archive_adjusted *= 1 + (settings.archive_overhead_percent / 100)
        archive_adjusted *= 1 + (settings.archive_safety_margin_percent / 100)
        archive_adjusted *= settings.archive_redundancy_factor
        assumptions.append("Archive storage assumes continuous recording for the configured share of channels.")

    delivery_assumption = (
        "OTT or unicast estimate"
        if req.delivery_mode in {DeliveryMode.OTT, DeliveryMode.BOTH}
        else "Local network estimate with multicast caveat"
    )
    assumptions.append("LAN multicast distribution may reduce access bandwidth compared with unicast delivery.")
    assumptions.append("Adaptive bitrate delivery can increase origin, storage, and packaging requirements.")

    return CapacityEstimate(
        assumed_concurrent_viewers=concurrent,
        delivery_assumption=delivery_assumption,
        unicast_bandwidth_formula=(
            f"{concurrent} concurrent viewers x {req.average_channel_bitrate_mbps} Mbps x "
            f"{overhead_factor:.2f} overhead x {safety_factor:.2f} safety"
        ),
        base_bandwidth_mbps=round(base_bandwidth, 2),
        safety_adjusted_bandwidth_mbps=round(adjusted_bandwidth, 2),
        estimated_archive_storage_tb=round(archive_base, 2),
        safety_adjusted_archive_storage_tb=round(archive_adjusted, 2),
        assumptions=assumptions,
    )

