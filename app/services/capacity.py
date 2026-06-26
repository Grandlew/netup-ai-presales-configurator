from __future__ import annotations

from app.schemas import CapacityEstimate, ClaimStatus, CustomerRequirements, DeliveryMode, ProjectType, Service
from app.settings import get_settings


RECORDING_SERVICES = {Service.CATCHUP, Service.TIMESHIFT}


def estimate_capacity(req: CustomerRequirements) -> CapacityEstimate:
    settings = get_settings()
    assumptions: list[str] = []

    concurrent = req.expected_concurrent_viewers
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

    overhead_factor = 1 + (settings.bandwidth_overhead_percent / 100)
    safety_factor = 1 + (settings.bandwidth_safety_margin_percent / 100)
    per_viewer_bandwidth = req.average_channel_bitrate_mbps
    base_unicast_bandwidth = concurrent * per_viewer_bandwidth
    adjusted_unicast_bandwidth = base_unicast_bandwidth * overhead_factor * safety_factor

    source_ingest_bandwidth = req.number_of_channels * req.average_channel_bitrate_mbps
    core_multicast_bandwidth = source_ingest_bandwidth if req.delivery_mode != DeliveryMode.OTT else None
    local_unicast_bandwidth = adjusted_unicast_bandwidth if req.delivery_mode == DeliveryMode.LOCAL else None
    ott_egress_bandwidth = adjusted_unicast_bandwidth if req.delivery_mode in {DeliveryMode.OTT, DeliveryMode.BOTH} else None

    storage_status = ClaimStatus.CALCULATED
    storage_status_message: str | None = None
    archive_scope_summary: str | None = None
    archive_base = 0.0
    archive_adjusted = 0.0
    storage_ingest_bandwidth = None

    recording_selected = any(service in req.services for service in RECORDING_SERVICES)
    if recording_selected:
        channels_to_record = req.channels_to_record or req.number_of_channels
        storage_ingest_bandwidth = channels_to_record * req.average_channel_bitrate_mbps
        if not req.archive_days:
            storage_status = ClaimStatus.UNKNOWN
            storage_status_message = (
                "Catch-up TV was selected, but storage cannot be calculated until the retention period and recording scope are provided."
            )
            archive_scope_summary = "Pending retention period and recording scope."
        else:
            seconds = req.archive_days * 86_400
            recording_ratio = min(1.0, channels_to_record / max(req.number_of_channels, 1)) * settings.archive_recording_ratio
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
            archive_scope_summary = (
                f"{channels_to_record} recorded channels for {req.archive_days} days at {req.average_channel_bitrate_mbps:g} Mbps."
            )
            assumptions.append(
                "Archive storage assumes continuous recording for the selected retention period and recording scope."
            )
    else:
        storage_status = ClaimStatus.CONFIRMED
        storage_status_message = "Recording services were not selected, so archive storage is not required for this estimate."
        archive_scope_summary = "No recording services selected."

    delivery_assumption = (
        "OTT/mobile unicast estimate"
        if req.delivery_mode in {DeliveryMode.OTT, DeliveryMode.BOTH}
        else "Local-network estimate with multicast caveat"
    )
    assumptions.append("Multicast distribution does not scale linearly with viewer count in the same way as unicast delivery.")
    assumptions.append("Wi-Fi access design requires separate radio coverage and concurrency analysis.")
    assumptions.append("Adaptive bitrate delivery can increase origin, storage, and packaging requirements.")
    assumptions.append("Protocol and encryption overhead should be validated against the final delivery topology.")

    return CapacityEstimate(
        assumed_concurrent_viewers=concurrent,
        delivery_assumption=delivery_assumption,
        unicast_bandwidth_formula=(
            f"{concurrent} concurrent viewers x {req.average_channel_bitrate_mbps:g} Mbps x "
            f"{overhead_factor:.2f} protocol overhead x {safety_factor:.2f} safety"
        ),
        base_bandwidth_mbps=round(base_unicast_bandwidth, 2),
        safety_adjusted_bandwidth_mbps=round(adjusted_unicast_bandwidth, 2),
        source_ingest_bandwidth_mbps=round(source_ingest_bandwidth, 2),
        core_network_multicast_bandwidth_mbps=round(core_multicast_bandwidth, 2) if core_multicast_bandwidth is not None else None,
        local_unicast_access_bandwidth_mbps=round(local_unicast_bandwidth, 2) if local_unicast_bandwidth is not None else None,
        ott_origin_egress_bandwidth_mbps=round(ott_egress_bandwidth, 2) if ott_egress_bandwidth is not None else None,
        per_viewer_bandwidth_mbps=round(per_viewer_bandwidth, 2),
        storage_ingest_bandwidth_mbps=round(storage_ingest_bandwidth, 2) if storage_ingest_bandwidth is not None else None,
        estimated_archive_storage_tb=round(archive_base, 2),
        safety_adjusted_archive_storage_tb=round(archive_adjusted, 2),
        storage_status=storage_status,
        storage_status_message=storage_status_message,
        archive_scope_summary=archive_scope_summary,
        assumptions=assumptions,
    )
