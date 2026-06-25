from __future__ import annotations

from app.schemas import (
    ConfigOption,
    ConfigOptionsResponse,
    DeliveryMode,
    OutputType,
    ProjectType,
    Service,
    SignalSource,
    ViewerDevice,
)
from app.settings import get_settings


def _labelize(value: str) -> str:
    return value.replace("_", " ").replace("ott", "OTT").replace("iptv", "IPTV").title()


def get_options() -> ConfigOptionsResponse:
    settings = get_settings()
    return ConfigOptionsResponse(
        project_types=[ConfigOption(value=item.value, label=_labelize(item.value)) for item in ProjectType],
        signal_sources=[ConfigOption(value=item.value, label=_labelize(item.value)) for item in SignalSource],
        services=[ConfigOption(value=item.value, label=_labelize(item.value)) for item in Service],
        viewer_devices=[ConfigOption(value=item.value, label=_labelize(item.value)) for item in ViewerDevice],
        delivery_modes=[ConfigOption(value=item.value, label=_labelize(item.value)) for item in DeliveryMode],
        output_types=[ConfigOption(value=item.value, label=_labelize(item.value)) for item in OutputType],
        disclaimer=(
            "This configurator provides a preliminary recommendation. Final equipment, licensing, "
            "capacity, compatibility, redundancy, and pricing must be validated by a NetUP engineer."
        ),
        data_retention_note=settings.data_retention_note,
    )

