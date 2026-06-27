from app.engine import estimate_capacity, recommend
from app.schemas import ClaimStatus, CustomerRequirements


def sample_hotel_requirements() -> CustomerRequirements:
    return CustomerRequirements(
        project_type="hotel",
        country="United States",
        subscribers_or_rooms=180,
        expected_concurrent_viewers=100,
        number_of_channels=85,
        signal_sources=["satellite", "ip_streams"],
        services=["live_tv", "epg", "catchup_tv"],
        viewer_devices=["smart_tv", "mobile"],
        delivery_mode="internet_ott",
        adaptive_bitrate_required=False,
        archive_days=0,
        budget_range="To be discussed",
        target_launch_date="2026-Q4",
        contact_name="Jane Doe",
        company="Northwind Hospitality",
        email="jane@example.com",
    )


def test_hotel_example_does_not_duplicate_headend_functions():
    result = recommend(sample_hotel_requirements())
    names = {item.product for item in result.recommendations}

    assert "NetUP IPTV Combine 8x" in names
    assert "NetUP DVB IP Streamer" not in names
    assert "NetUP Stream Processor" in names
    assert result.rule_version == "2026.06-mvp"
    assert result.audit_trace["overlaps_found"][0]["resolution"] == "duplicate_removed"


def test_large_operator_keeps_provisional_operator_stack():
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
    assert "x 6 Mbps" in result.unicast_bandwidth_formula


def test_catchup_storage_is_pending_when_retention_is_missing():
    result = recommend(sample_hotel_requirements())
    assert result.capacity.storage_status == ClaimStatus.UNKNOWN
    assert result.capacity.storage_status_message is not None
    assert "Catch-up retention period" in result.missing_information
    assert result.readiness.capacity_estimate_ready is False


def test_smart_tv_compatibility_stays_conditional_without_model_confirmation():
    result = recommend(sample_hotel_requirements())
    status_by_claim = {item.claim: item.status for item in result.claim_statements}

    assert status_by_claim["Native Smart TV delivery may avoid external set-top boxes."] in {
        ClaimStatus.UNKNOWN,
        ClaimStatus.CONDITIONAL,
    }
    assert "Hotel TV model and compatibility path" in result.missing_information


def test_existing_headend_prefers_hotel_software_layer():
    req = sample_hotel_requirements().model_copy(
        update={
            "existing_equipment": "Existing DVB-IP headend already installed in the hotel",
            "delivery_mode": "both",
        }
    )
    result = recommend(req)
    names = {item.product for item in result.recommendations}

    assert "NetUP.tv Hotel Software" in names
    assert "NetUP DVB IP Streamer" not in names
    assert "NetUP IPTV Combine 8x" not in names


def test_duplicate_recommendations_are_suppressed():
    result = recommend(sample_hotel_requirements())
    products = [item.product for item in result.recommendations]
    assert products.count("NetUP Stream Processor") == 1


def test_backend_accepts_new_room_tv_delivery_values():
    req = sample_hotel_requirements().model_copy(
        update={
            "in_property_network_type": "managed_lan_multicast",
            "hotel_tv_brand": "LG",
            "hotel_tv_model": "UR780H",
            "hotel_tv_hospitality_grade": True,
        }
    )

    result = recommend(req)

    assert result.recommended_architecture is not None
    tv_network_nodes = [
        node
        for branch in result.recommended_architecture.branches
        for node in branch.nodes
        if node.id == "tv_network"
    ]
    assert tv_network_nodes
    assert "Managed LAN multicast" in tv_network_nodes[0].label


def test_backend_normalizes_blank_archive_days():
    req = CustomerRequirements(
        project_type="hotel",
        subscribers_or_rooms=180,
        expected_concurrent_viewers=100,
        number_of_channels=85,
        signal_sources=["satellite", "ip_streams"],
        services=["live_tv", "catchup_tv"],
        viewer_devices=["smart_tv", "mobile"],
        delivery_mode="both",
        archive_days="",
    )

    assert req.archive_days == 0
