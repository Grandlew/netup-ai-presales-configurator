from app.engine import estimate_capacity, recommend
from app.schemas import CustomerRequirements


def sample_hotel_requirements() -> CustomerRequirements:
    return CustomerRequirements(
        project_type="hotel",
        country="United States",
        subscribers_or_rooms=180,
        expected_concurrent_viewers=100,
        number_of_channels=85,
        signal_sources=["satellite", "ip_streams"],
        services=["live_tv", "epg", "catchup_tv", "video_on_demand"],
        viewer_devices=["smart_tv", "mobile"],
        delivery_mode="both",
        adaptive_bitrate_required=True,
        archive_days=7,
        budget_range="To be discussed",
        target_launch_date="2026-Q4",
        contact_name="Jane Doe",
        company="Northwind Hospitality",
        email="jane@example.com",
    )


def test_hotel_ott_recommendation():
    result = recommend(sample_hotel_requirements())
    names = {item.product for item in result.recommendations}

    assert "NetUP IPTV Combine 8x" in names
    assert "NetUP DVB-IP Streamer" in names
    assert "NetUP Stream Processor" in names
    assert "NetUP VoD capability" in names
    assert result.capacity.estimated_archive_storage_tb > 0
    assert result.rule_version == "2026.06-mvp"


def test_large_operator_gets_complex():
    req = CustomerRequirements(
        project_type="large_operator",
        subscribers_or_rooms=50_000,
        expected_concurrent_viewers=10_000,
        number_of_channels=250,
        signal_sources=["ip_streams"],
        services=["live_tv", "billing"],
        viewer_devices=["set_top_box", "web_browser"],
        delivery_mode="both",
    )

    result = recommend(req)
    names = {item.product for item in result.recommendations}

    assert "NetUP IPTV/OTT Complex" in names
    assert "NetUP Middleware and Billing" in names
    assert "NetUP Stream Processor" in names


def test_capacity_formula_uses_safety_margin():
    result = estimate_capacity(sample_hotel_requirements())

    assert result.base_bandwidth_mbps == 600
    assert result.safety_adjusted_bandwidth_mbps > result.base_bandwidth_mbps
    assert "x 6.0 Mbps" in result.unicast_bandwidth_formula


def test_missing_storage_is_reported_when_archive_requested():
    req = sample_hotel_requirements().model_copy(update={"available_storage_tb": None})
    result = recommend(req)
    assert "Available storage capacity" in result.missing_information


def test_duplicate_recommendations_are_suppressed():
    result = recommend(sample_hotel_requirements())
    products = [item.product for item in result.recommendations]
    assert products.count("NetUP Stream Processor") == 1
