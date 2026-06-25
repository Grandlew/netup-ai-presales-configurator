from __future__ import annotations

from app.schemas import PartialCustomerRequirements


REQUIRED_FIELDS = [
    ("project_type", "Project type"),
    ("subscribers_or_rooms", "Number of subscribers, rooms, or endpoints"),
    ("number_of_channels", "Number of TV channels"),
    ("signal_sources", "Signal sources"),
    ("services", "Required services"),
    ("viewer_devices", "Viewer devices"),
    ("delivery_mode", "Delivery mode"),
]


def missing_required_fields(req: PartialCustomerRequirements) -> list[str]:
    missing: list[str] = []
    for field_name, label in REQUIRED_FIELDS:
        value = getattr(req, field_name)
        if value is None or value == []:
            missing.append(label)
    return missing


def next_question_for(req: PartialCustomerRequirements) -> str | None:
    prompts = [
        ("project_type", "What type of project is this: hotel, hospital, university, operator, transport, or another environment?"),
        ("subscribers_or_rooms", "How many subscribers, rooms, screens, or endpoints do you plan to serve?"),
        ("number_of_channels", "How many TV channels do you expect to distribute?"),
        ("signal_sources", "Which signal sources will you use: satellite, terrestrial, cable, existing IP streams, ASI, or HDMI/SDI?"),
        ("services", "Which services do you need, such as live TV, EPG, catch-up TV, time-shift, VoD, billing, advertising, or your own channel?"),
        ("viewer_devices", "Which end-user devices must be supported: smart TVs, set-top boxes, mobile apps, web browsers, or a mix?"),
        ("delivery_mode", "Will delivery stay on a local network, go over OTT/internet, or both?"),
    ]
    for field_name, prompt in prompts:
        value = getattr(req, field_name)
        if value is None or value == []:
            return prompt
    return None

