from __future__ import annotations

from app.schemas import PartialCustomerRequirements, ProjectType, Service, ViewerDevice


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
    if req.project_type == ProjectType.HOTEL:
        if ViewerDevice.SMART_TV in req.viewer_devices and not req.hotel_tv_model:
            return "What TV model or series will be installed in the hotel rooms?"
        if ViewerDevice.SMART_TV in req.viewer_devices and req.hotel_tv_hospitality_grade is None:
            return "Are the room TVs hospitality/commercial models or standard retail TVs?"
        if req.mobile_viewing_scope is None and ViewerDevice.MOBILE in req.viewer_devices:
            return "Should mobile viewing work only on hotel Wi-Fi, outside the property as well, or both?"
        if Service.CATCHUP in req.services and not req.archive_days:
            return "How many days of Catch-up TV should be retained, and should all channels be recorded?"
        if req.in_property_network_type is None and ViewerDevice.SMART_TV in req.viewer_devices:
            return "Will TV channels reach the rooms over Ethernet, Wi-Fi, coaxial cable, or a hybrid network?"
        if req.pms_integration_required is None:
            return "Does the hotel require PMS integration for welcome screens, billing, or guest messaging?"

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
