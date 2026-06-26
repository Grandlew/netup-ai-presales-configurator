from __future__ import annotations

from dataclasses import dataclass

from app.schemas import (
    ArchitectureBranch,
    ArchitectureNode,
    ArchitectureOption,
    ClaimStatement,
    ClaimStatus,
    CustomerRequirements,
    DeliveryMode,
    EvidenceReference,
    MissingInformationItem,
    ProductRecommendation,
    ProjectType,
    ReadinessState,
    RecommendationResponse,
    RuleTraceEntry,
    Service,
    ViewerDevice,
)
from app.services.capabilities import capability_products_by_id, load_capabilities
from app.services.capacity import estimate_capacity
from app.services.requirements import next_question_for
from app.services.rules import load_rules


@dataclass
class RuleMatch:
    matched: bool
    passed: list[str]
    failed: list[str]


PRODUCT_NAME_TO_ID = {
    "NetUP IPTV Combine Mini": "iptv_combine_mini",
    "NetUP IPTV Combine 8x": "iptv_combine_8x",
    "NetUP IPTV Combine 16x": "iptv_combine_16x",
    "NetUP IPTV/OTT Complex": "iptv_ott_complex",
    "NetUP DVB-IP Streamer": "dvb_ip_streamer",
    "NetUP DVB IP Streamer": "dvb_ip_streamer",
    "NetUP Stream Processor": "stream_processor",
    "NetUP Streamer ASI 8x": "streamer_asi",
    "NetUP Streamer ASI": "streamer_asi",
    "NetUP Streamer xC": "streamer_xc",
    "NetUP VoD capability": "vod_capability",
    "NetUP Middleware and Billing": "middleware_billing",
    "NetUP Combine Hotel": "combine_hotel",
    "NetUP.tv Hotel Software": "netup_tv_hotel_software",
    "NetUP SmartTV": "netup_smarttv",
}


def _label(value) -> str:
    if hasattr(value, "value"):
        return value.value
    return str(value)


def _evaluate_conditions(req: CustomerRequirements, conditions: dict) -> RuleMatch:
    passed: list[str] = []
    failed: list[str] = []
    for field_name, expected in conditions.items():
        actual = getattr(req, field_name)
        if isinstance(expected, dict):
            if "max" in expected:
                ok = actual <= expected["max"]
                (passed if ok else failed).append(f"{field_name} <= {expected['max']}")
            if "min" in expected:
                ok = actual >= expected["min"]
                (passed if ok else failed).append(f"{field_name} >= {expected['min']}")
            if "in" in expected:
                candidates = set(expected["in"])
                ok = _label(actual) in candidates
                (passed if ok else failed).append(f"{field_name} in {sorted(candidates)}")
            if "contains_any" in expected:
                candidates = set(expected["contains_any"])
                actual_values = {_label(item) for item in actual}
                ok = bool(actual_values & candidates)
                (passed if ok else failed).append(f"{field_name} overlaps {sorted(candidates)}")
            if "contains_all" in expected:
                candidates = set(expected["contains_all"])
                actual_values = {_label(item) for item in actual}
                ok = candidates.issubset(actual_values)
                (passed if ok else failed).append(f"{field_name} includes {sorted(candidates)}")
            if "equals" in expected:
                ok = actual == expected["equals"]
                (passed if ok else failed).append(f"{field_name} == {expected['equals']}")
            continue

        ok = _label(actual) == expected
        (passed if ok else failed).append(f"{field_name} == {expected}")

    return RuleMatch(matched=not failed, passed=passed, failed=failed)


def _requires_recording(req: CustomerRequirements) -> bool:
    return any(service in req.services for service in {Service.CATCHUP, Service.TIMESHIFT})


def _smart_tv_compatibility_status(req: CustomerRequirements) -> tuple[ClaimStatus, list[str]]:
    conditions: list[str] = []
    if ViewerDevice.SMART_TV not in req.viewer_devices:
        return ClaimStatus.CONFIRMED, conditions
    if req.project_type != ProjectType.HOTEL:
        return ClaimStatus.CONDITIONAL, ["Exact TV platform compatibility must be confirmed."]

    if not req.hotel_tv_brand or not req.hotel_tv_model:
        conditions.append("Exact hotel TV brand and model/series")
        return ClaimStatus.UNKNOWN, conditions
    if req.hotel_tv_hospitality_grade is not True:
        conditions.append("Hospitality/commercial TV confirmation")
        return ClaimStatus.CONDITIONAL, conditions
    if req.hotel_tv_brand.strip().lower() == "lg" and req.lg_procentric_direct_confirmed is not True:
        conditions.append("LG Pro:Centric Direct support")
        return ClaimStatus.CONDITIONAL, conditions
    return ClaimStatus.CONFIRMED, conditions


def _has_existing_headend(req: CustomerRequirements) -> bool:
    equipment = (req.existing_equipment or "").lower()
    return any(term in equipment for term in ["headend", "dvb-ip", "dvb ip", "satellite receiver", "cas"])


def _build_missing_information(req: CustomerRequirements, compatibility_status: ClaimStatus) -> list[MissingInformationItem]:
    missing: list[MissingInformationItem] = []

    def add(code: str, label: str, category: str, reason: str, question: str) -> None:
        missing.append(
            MissingInformationItem(
                code=code,
                label=label,
                category=category,
                status=ClaimStatus.UNKNOWN,
                reason=reason,
                question=question,
            )
        )

    if req.expected_concurrent_viewers is None:
        add(
            "concurrent_viewers",
            "Expected concurrent viewers",
            "capacity-critical",
            "Viewer concurrency directly affects unicast and OTT egress sizing.",
            "How many simultaneous viewers should the system support at peak load?",
        )
    if _requires_recording(req) and not req.archive_days:
        add(
            "catchup_retention",
            "Catch-up retention period",
            "capacity-critical",
            "Catch-up TV was selected, but storage cannot be sized until the retention period is known.",
            "How many days of Catch-up TV should be retained?",
        )
    if _requires_recording(req) and req.channels_to_record is None:
        add(
            "recording_scope",
            "Channels to record",
            "capacity-critical",
            "Recording scope is required to size storage and recording ingest bandwidth.",
            "How many channels should be recorded for Catch-up TV or time-shift?",
        )
    if compatibility_status != ClaimStatus.CONFIRMED and ViewerDevice.SMART_TV in req.viewer_devices:
        add(
            "hotel_tv_model",
            "Hotel TV model and compatibility path",
            "recommendation-critical",
            "Native Smart TV delivery cannot be confirmed until the TV model, hospitality status, and platform compatibility are known.",
            "What exact TV model or series will be installed, and are these hospitality/commercial TVs?",
        )
        if (req.hotel_tv_brand or "").strip().lower() == "lg" and req.lg_procentric_direct_confirmed is not True:
            add(
                "lg_procentric",
                "LG Pro:Centric Direct confirmation",
                "recommendation-critical",
                "Official LG hotel-TV guidance calls out Pro:Centric Direct for correct operation of external hotel applications.",
                "Do the LG hotel TVs support Pro:Centric Direct?",
            )
    if req.mobile_viewing_scope is None and ViewerDevice.MOBILE in req.viewer_devices:
        add(
            "mobile_scope",
            "Mobile viewing scope",
            "recommendation-critical",
            "The architecture differs between hotel-Wi-Fi-only viewing and off-property OTT access.",
            "Should mobile viewing work only on hotel Wi-Fi, outside the property as well, or both?",
        )
    if req.in_property_network_type is None and req.project_type == ProjectType.HOTEL and ViewerDevice.SMART_TV in req.viewer_devices:
        add(
            "in_property_network",
            "In-property TV delivery network",
            "recommendation-critical",
            "Room-TV delivery depends on whether the hotel uses Ethernet, Wi-Fi, coaxial, or a hybrid network.",
            "Will room TVs be served over Ethernet, Wi-Fi, coaxial cable, or a hybrid network?",
        )
    if req.pms_integration_required is None and req.project_type == ProjectType.HOTEL:
        add(
            "pms_integration",
            "PMS integration requirement",
            "commercial-implementation",
            "Hotel welcome screens, billing, and guest messaging depend on PMS integration requirements.",
            "Does the hotel require PMS integration?",
        )
    if req.existing_equipment is None:
        add(
            "existing_equipment",
            "Existing equipment",
            "commercial-implementation",
            "Existing headend or distribution equipment can materially change the recommended architecture.",
            "What headend, middleware, or hotel-TV equipment already exists on site?",
        )
    if req.redundancy_required is False:
        add(
            "redundancy_confirmation",
            "Redundancy requirement confirmation",
            "commercial-implementation",
            "Failover design affects hardware selection and quotation scope.",
            "Is high availability or channel-source redundancy required?",
        )
    if req.content_protection_required is None and req.delivery_mode in {DeliveryMode.OTT, DeliveryMode.BOTH}:
        add(
            "content_protection",
            "Content-protection requirement",
            "commercial-implementation",
            "Encryption and rights-protection requirements affect OTT and device architecture.",
            "Are there content-protection or encryption requirements for OTT or mobile delivery?",
        )
    return missing


def _required_capabilities(req: CustomerRequirements) -> list[str]:
    capabilities = ["core_iptv_platform"]
    if any(source.value in {"satellite", "terrestrial", "cable"} for source in req.signal_sources):
        capabilities.append("dvb_reception")
    if any(source.value == "ip_streams" for source in req.signal_sources):
        capabilities.append("ip_ingestion")
    if any(source.value == "asi" for source in req.signal_sources):
        capabilities.append("asi_ingestion")
    if any(source.value == "hdmi_sdi" for source in req.signal_sources):
        capabilities.append("hdmi_sdi_encoding")
    if req.delivery_mode in {DeliveryMode.OTT, DeliveryMode.BOTH} or ViewerDevice.MOBILE in req.viewer_devices:
        capabilities.append("mobile_delivery")
    if ViewerDevice.SMART_TV in req.viewer_devices:
        capabilities.append("smart_tv_delivery")
    if _requires_recording(req):
        capabilities.append("catchup_tv")
    if Service.VOD in req.services:
        capabilities.append("video_on_demand")
    if req.project_type == ProjectType.HOTEL:
        capabilities.append("hospitality_iptv_hub")
    return capabilities


def _collect_rule_candidates(req: CustomerRequirements, version: str, rules: list[dict]) -> tuple[list[dict], list[RuleTraceEntry]]:
    candidates: list[dict] = []
    trace: list[RuleTraceEntry] = []
    seen_products: set[str] = set()
    registry = capability_products_by_id()

    for rule in rules:
        if not rule["enabled"]:
            continue
        match = _evaluate_conditions(req, rule["conditions"])
        trace.append(
            RuleTraceEntry(
                rule_id=rule["rule_id"],
                product_family=rule["product_family"],
                matched=match.matched,
                passed_conditions=match.passed,
                failed_conditions=match.failed,
                version=version,
            )
        )
        if not match.matched:
            continue

        product_id = PRODUCT_NAME_TO_ID.get(rule["product_family"])
        if product_id and product_id in seen_products:
            continue

        if product_id:
            seen_products.add(product_id)
        candidates.append(
            {
                "rule": rule,
                "product_id": product_id,
                "passed_conditions": match.passed,
                "failed_conditions": match.failed,
                "registry": registry.get(product_id) if product_id else None,
            }
        )

    return candidates, trace


def _resolve_core_product(req: CustomerRequirements, candidates: list[dict]) -> tuple[str | None, list[dict]]:
    alternatives: list[dict] = []

    if req.project_type == ProjectType.HOTEL and _has_existing_headend(req):
        return "netup_tv_hotel_software", alternatives

    core_candidates = [item for item in candidates if item["product_id"] in {"iptv_combine_8x", "iptv_combine_16x"}]
    if core_candidates:
        core_candidates.sort(key=lambda item: 0 if item["product_id"] == "iptv_combine_8x" else 1)
        selected = core_candidates[0]["product_id"]
        if req.project_type == ProjectType.HOTEL:
            alternatives.append({"product_id": "combine_hotel", "preference": "alternative"})
        return selected, alternatives

    if req.project_type == ProjectType.HOTEL:
        return "combine_hotel", alternatives

    fallback_core_order = ["iptv_ott_complex", "iptv_combine_16x", "iptv_combine_8x"]
    for product_id in fallback_core_order:
        if any(candidate["product_id"] == product_id for candidate in candidates):
            return product_id, alternatives

    return None, alternatives


def _build_product_recommendation(
    product_id: str,
    req: CustomerRequirements,
    reason: str,
    *,
    rule_id: str,
    claim_status: ClaimStatus,
    conditions: list[str] | None = None,
) -> ProductRecommendation:
    registry = capability_products_by_id()
    product = registry[product_id]
    evidence_ids = [entry["id"] for entry in product.get("evidence_sources", [])]
    object_type = ", ".join(product["product_role"][:1]) if product.get("product_role") else "Product"
    role_summary = (
        "Core hotel TV and IPTV platform"
        if product_id in {"combine_hotel", "iptv_combine_8x", "iptv_combine_16x"}
        else "Supporting product for a required capability"
    )
    return ProductRecommendation(
        canonical_product_id=product_id,
        product=product["official_product_name"],
        category=product["product_family"],
        object_type=object_type,
        role_summary=role_summary,
        reason=reason,
        rule_id=rule_id,
        claim_status=claim_status,
        provided_capabilities=product.get("included_functions", []),
        conditions=conditions or [],
        evidence_ids=evidence_ids,
        validation_status="Pending NetUP validation" if product.get("validation_status") == "pending_netup_validation" else "Requires NetUP validation",
        warning=None,
    )


def _build_references(product_ids: list[str]) -> list[EvidenceReference]:
    registry = capability_products_by_id()
    references: list[EvidenceReference] = []
    seen: set[str] = set()
    for product_id in product_ids:
        product = registry.get(product_id)
        if not product:
            continue
        for source in product.get("evidence_sources", []):
            if source["id"] in seen:
                continue
            seen.add(source["id"])
            references.append(
                EvidenceReference(
                    id=source["id"],
                    title=source["title"],
                    url=source["url"],
                    publication_date=product.get("evidence_date"),
                    extracted_capability=source["extracted_capability"],
                    confidence=ClaimStatus(product.get("evidence_strength", "provisional")),
                    reviewed_status=product.get("validation_status", "pending_netup_validation"),
                )
            )
    return references


def _build_architecture(
    req: CustomerRequirements,
    selected_products: list[str],
    missing_items: list[MissingInformationItem],
) -> tuple[ArchitectureOption | None, list[ArchitectureOption]]:
    if not selected_products:
        return None, []

    def node(node_id: str, label: str, kind: str, status: ClaimStatus, details: list[str] | None = None) -> ArchitectureNode:
        return ArchitectureNode(id=node_id, label=label, kind=kind, status=status, details=details or [])

    branches: list[ArchitectureBranch] = []
    source_label = " / ".join(sorted({_label(source).replace("_", " ") for source in req.signal_sources}))
    core_product = selected_products[0]
    core_name = capability_products_by_id().get(core_product, {}).get("official_product_name", core_product)

    tv_branch_nodes = [
        node("sources", source_label.title(), "customer-owned source", ClaimStatus.CONFIRMED),
        node("core", core_name, "NetUP hardware" if "software" not in core_product else "NetUP software", ClaimStatus.INFERRED),
    ]
    network_status = ClaimStatus.CONFIRMED if req.in_property_network_type else ClaimStatus.UNKNOWN
    tv_branch_nodes.append(
        node(
            "tv_network",
            (
                f"{req.in_property_network_type.value.replace('_', ' ').title()} in-property TV network"
                if req.in_property_network_type
                else "In-property TV delivery network"
            ),
            "network/delivery layer",
            network_status,
        )
    )
    if ViewerDevice.SMART_TV in req.viewer_devices:
        tv_branch_nodes.append(node("smart_tv", "Hospitality Smart TVs", "client application/device", ClaimStatus.CONDITIONAL))
    elif ViewerDevice.SET_TOP_BOX in req.viewer_devices:
        tv_branch_nodes.append(node("stb", "Set-top boxes", "client application/device", ClaimStatus.CONFIRMED))
    branches.append(
        ArchitectureBranch(
            name="In-room TV delivery",
            status=ClaimStatus.INFERRED if network_status == ClaimStatus.CONFIRMED else ClaimStatus.UNKNOWN,
            nodes=tv_branch_nodes,
            note="This path should be confirmed against the hotel’s physical room-network design.",
        )
    )

    if ViewerDevice.MOBILE in req.viewer_devices:
        mobile_nodes = [node("mobile_origin", core_name, "NetUP hardware" if "software" not in core_product else "NetUP software", ClaimStatus.INFERRED)]
        if "stream_processor" in selected_products:
            mobile_nodes.append(node("processor", "NetUP Stream Processor", "NetUP hardware", ClaimStatus.CONDITIONAL))
        mobile_nodes.append(
            node(
                "mobile_scope",
                (
                    req.mobile_viewing_scope.value.replace("_", " ").title()
                    if req.mobile_viewing_scope
                    else "Mobile delivery scope"
                ),
                "network/delivery layer",
                ClaimStatus.CONFIRMED if req.mobile_viewing_scope else ClaimStatus.UNKNOWN,
            )
        )
        mobile_nodes.append(node("mobile_clients", "Mobile devices", "client application/device", ClaimStatus.CONFIRMED))
        branches.append(
            ArchitectureBranch(
                name="Mobile delivery",
                status=ClaimStatus.CONDITIONAL if req.mobile_viewing_scope else ClaimStatus.UNKNOWN,
                nodes=mobile_nodes,
                note="The mobile path remains conditional until the project confirms whether access is limited to hotel Wi-Fi or extends off-property.",
            )
        )

    recommended = ArchitectureOption(
        name="Preliminary recommended architecture",
        status=ClaimStatus.INFERRED if not missing_items else ClaimStatus.CONDITIONAL,
        preference="recommended",
        reason="Selected to cover the currently identified capabilities without duplicating DVB headend functions.",
        tradeoffs=[
            "Hotel-specific software and compatibility questions still need confirmation.",
            "Storage sizing remains incomplete until recording scope is confirmed." if any(item.code == "catchup_retention" for item in missing_items) else "Capacity still requires engineering validation.",
        ],
        information_required=[item.label for item in missing_items[:4]],
        branches=branches,
    )

    alternatives: list[ArchitectureOption] = []
    if req.project_type == ProjectType.HOTEL and not _has_existing_headend(req):
        alternatives.append(
            ArchitectureOption(
                name="Hospitality-focused alternative",
                status=ClaimStatus.CONDITIONAL,
                preference="alternative",
                reason="Official NetUP hospitality pages present NetUP Combine Hotel and NetUP.tv Hotel Software as hotel-specific options with PMS and guest-experience features.",
                tradeoffs=[
                    "Hotel-specific fit may be stronger for welcome screens, PMS workflows, and guest-service monetization.",
                    "Exact capacity thresholds for the hotel bundle remain pending NetUP validation in this MVP.",
                ],
                information_required=["PMS integration requirement", "Hospitality TV model compatibility", "In-property delivery method"],
                branches=[
                    ArchitectureBranch(
                        name="Hotel stack",
                        status=ClaimStatus.CONDITIONAL,
                        nodes=[
                            node("hotel_sources", source_label.title(), "customer-owned source", ClaimStatus.CONFIRMED),
                            node("combine_hotel", "NetUP Combine Hotel", "NetUP hardware", ClaimStatus.CONDITIONAL),
                            node("hotel_clients", "Hospitality TVs / guest devices", "client application/device", ClaimStatus.CONDITIONAL),
                        ],
                        note="Use when hotel-specific guest-experience functions outweigh a generic IPTV deployment.",
                    )
                ],
            )
        )
    return recommended, alternatives


def build_recommendation(req: CustomerRequirements) -> tuple[RecommendationResponse, list[RuleTraceEntry]]:
    rules_config = load_rules()
    version = rules_config["version"]
    rules = rules_config["rules"]
    registry_meta = load_capabilities()
    candidates, trace = _collect_rule_candidates(req, version, rules)
    compatibility_status, compatibility_conditions = _smart_tv_compatibility_status(req)
    missing_items = _build_missing_information(req, compatibility_status)
    capacity = estimate_capacity(req)

    required_capabilities = _required_capabilities(req)
    selected_products: list[str] = []
    rejected_products: list[dict] = []
    overlaps_found: list[dict] = []

    core_product, alternative_hints = _resolve_core_product(req, candidates)
    if core_product:
        selected_products.append(core_product)

    if _has_existing_headend(req):
        if "netup_tv_hotel_software" not in selected_products and req.project_type == ProjectType.HOTEL:
            selected_products.insert(0, "netup_tv_hotel_software")
    else:
        if any(source.value in {"satellite", "terrestrial", "cable"} for source in req.signal_sources):
            if core_product in {"iptv_combine_8x", "iptv_combine_16x"}:
                overlaps_found.append(
                    {
                        "function": "dvb_to_ip",
                        "provided_by": [core_product, "dvb_ip_streamer"],
                        "resolution": "duplicate_removed",
                        "reason": "The selected IPTV Combine model already includes DVB/IP reception for the current hotel baseline.",
                    }
                )
                rejected_products.append({"product_id": "dvb_ip_streamer", "reason": "Headend overlap with selected IPTV Combine model."})
            else:
                selected_products.append("dvb_ip_streamer")

    if (
        req.delivery_mode in {DeliveryMode.OTT, DeliveryMode.BOTH}
        or ViewerDevice.MOBILE in req.viewer_devices
        or ViewerDevice.WEB in req.viewer_devices
    ):
        selected_products.append("stream_processor")

    if any(service == Service.BILLING for service in req.services):
        selected_products.append("middleware_billing")
    if Service.VOD in req.services:
        selected_products.append("vod_capability")

    if req.project_type == ProjectType.HOTEL and _has_existing_headend(req):
        selected_products = [product for product in selected_products if product not in {"iptv_combine_8x", "iptv_combine_16x", "dvb_ip_streamer"}]

    selected_products = list(dict.fromkeys(selected_products))

    recommended_architecture, alternative_architectures = _build_architecture(req, selected_products, missing_items)

    recommendations: list[ProductRecommendation] = []
    for product_id in selected_products:
        if product_id == "netup_tv_hotel_software":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Proposed as the hotel software layer because the project indicates existing headend infrastructure that may already cover signal reception.",
                    rule_id="existing-headend-hotel-software",
                    claim_status=ClaimStatus.CONDITIONAL,
                    conditions=["Existing content source and server or virtualization must be confirmed."],
                )
            )
        elif product_id == "iptv_combine_8x":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Proposed as the core IPTV platform for the submitted 180-room, 85-channel hotel baseline because the official Combine 8x page includes DVB/IP reception and positions the platform for hotel-scale deployments.",
                    rule_id="core-combine-8x",
                    claim_status=ClaimStatus.PROVISIONAL,
                    conditions=["Exact DVB input count, hotel software scope, licensing, and redundancy still require NetUP engineering review."],
                )
            )
        elif product_id == "iptv_combine_16x":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Proposed as the larger all-in-one core platform because the submitted scope exceeds the lower provisional channel boundary.",
                    rule_id="core-combine-16x",
                    claim_status=ClaimStatus.PROVISIONAL,
                    conditions=["Confirm final DVB input planning, redundancy, and licensing scope with NetUP engineering."],
                )
            )
        elif product_id == "stream_processor":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Added for media-processing and protocol-output needs on the mobile/OTT path; the exact OTT service stack and adaptive-profile requirements still need confirmation.",
                    rule_id="processing-mobile-ott",
                    claim_status=ClaimStatus.CONDITIONAL,
                    conditions=["Confirm whether mobile viewing stays on hotel Wi-Fi only or also extends outside the property."],
                )
            )
        elif product_id == "dvb_ip_streamer":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Added as a separate modular headend only when the selected architecture does not already cover DVB reception and IP conversion.",
                    rule_id="headend-dvb-ip",
                    claim_status=ClaimStatus.CONDITIONAL,
                    conditions=["Confirm whether modular separation, expansion, or input-count requirements justify a separate headend."],
                )
            )
        elif product_id == "iptv_ott_complex":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Proposed as the provisional operator-scale core platform because the submitted project exceeds the small-network boundary in the current MVP rules.",
                    rule_id="core-complex",
                    claim_status=ClaimStatus.PROVISIONAL,
                    conditions=["Operator-scale sizing and final topology remain pending NetUP validation."],
                )
            )
        elif product_id == "middleware_billing":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Included because the submitted requirements explicitly call for billing or subscriber-management capabilities.",
                    rule_id="billing-service",
                    claim_status=ClaimStatus.PROVISIONAL,
                    conditions=["Confirm final commercial module scope with NetUP."],
                )
            )
        elif product_id == "vod_capability":
            recommendations.append(
                _build_product_recommendation(
                    product_id,
                    req,
                    "Included as a service-module placeholder because video-on-demand was requested.",
                    rule_id="vod",
                    claim_status=ClaimStatus.PROVISIONAL,
                    conditions=["Treat this as a service capability rather than a standalone hardware recommendation."],
                )
            )

    claim_statements = [
        ClaimStatement(
            claim="Native Smart TV delivery may avoid external set-top boxes.",
            status=compatibility_status if compatibility_status != ClaimStatus.CONFIRMED else ClaimStatus.CONFIRMED,
            conditions=compatibility_conditions,
            evidence_ids=["ref_smarttv_clients", "ref_hotel_tv_compatibility"],
            notes=(
                "Compatibility is stated at platform and hospitality-series level, not for every retail TV model."
                if compatibility_status != ClaimStatus.CONFIRMED
                else "The supplied hospitality-TV details are sufficient for a preliminary compatibility statement."
            ),
        ),
        ClaimStatement(
            claim=(
                f"The preliminary OTT/mobile unicast estimate is {capacity.safety_adjusted_bandwidth_mbps:g} Mbps."
                if capacity.ott_origin_egress_bandwidth_mbps is not None
                else f"The preliminary local unicast estimate is {capacity.safety_adjusted_bandwidth_mbps:g} Mbps."
            ),
            status=ClaimStatus.CALCULATED,
            evidence_ids=[],
            notes="This estimate is scoped to viewer egress and should not be treated as the full hotel multicast backbone requirement.",
        ),
    ]
    if capacity.storage_status != ClaimStatus.CONFIRMED:
        claim_statements.append(
            ClaimStatement(
                claim="Catch-up storage remains unresolved.",
                status=capacity.storage_status,
                evidence_ids=[],
                notes=capacity.storage_status_message,
            )
        )

    missing_information = [item.label for item in missing_items]
    warnings = [
        "This is a preliminary presales recommendation. Final equipment, licensing, compatibility, topology, and pricing must be validated by a NetUP engineer.",
    ]
    if capacity.storage_status == ClaimStatus.UNKNOWN:
        warnings.append("Catch-up TV was selected, so archive storage should not be treated as complete until retention and recording scope are confirmed.")
    if compatibility_status != ClaimStatus.CONFIRMED and ViewerDevice.SMART_TV in req.viewer_devices:
        warnings.append("Smart TV compatibility is conditional until the exact hotel TV model, operating platform, and hospitality features are confirmed.")
    if req.project_type == ProjectType.HOTEL and req.delivery_mode == DeliveryMode.OTT and ViewerDevice.SMART_TV in req.viewer_devices:
        warnings.append("For hotel projects, in-room TV delivery may still require a managed local-network or hybrid path even when mobile delivery uses OTT/unicast.")

    readiness = ReadinessState(
        intake_complete=True,
        preliminary_recommendation_ready=True,
        capacity_estimate_ready=capacity.storage_status != ClaimStatus.UNKNOWN,
        compatibility_review_ready=compatibility_status == ClaimStatus.CONFIRMED,
        engineering_review_required=True,
        quotation_ready=not any(item.category in {"recommendation-critical", "capacity-critical"} for item in missing_items),
    )

    official_references = _build_references(selected_products + [hint["product_id"] for hint in alternative_hints if hint["product_id"] in capability_products_by_id()])

    summary_delivery = "Internet / OTT delivery" if req.delivery_mode == DeliveryMode.OTT else "mixed delivery" if req.delivery_mode == DeliveryMode.BOTH else "local-network delivery"
    response = RecommendationResponse(
        project_summary=(
            f"Hotel solution for {req.subscribers_or_rooms} rooms, {req.number_of_channels} channels, with {summary_delivery}."
            if req.project_type == ProjectType.HOTEL
            else f"{req.project_type.value.replace('_', ' ').title()} project for {req.subscribers_or_rooms} rooms/subscribers, {req.number_of_channels} channels and {req.delivery_mode.value} delivery."
        ),
        recommendations=recommendations,
        capacity=capacity,
        warnings=warnings,
        missing_information=missing_information,
        missing_information_items=missing_items,
        assumptions=list(capacity.assumptions),
        readiness=readiness,
        claim_statements=claim_statements,
        official_references=official_references,
        recommended_architecture=recommended_architecture,
        alternative_architectures=alternative_architectures,
        next_question=(missing_items[0].question if missing_items else next_question_for(req.model_copy())),
        audit_trace={
            "submitted_requirements": req.model_dump(mode="json"),
            "required_capabilities": required_capabilities,
            "candidate_products": [candidate["product_id"] or candidate["rule"]["product_family"] for candidate in candidates],
            "rejected_products": rejected_products,
            "overlaps_found": overlaps_found,
            "selected_architecture": recommended_architecture.model_dump(mode="json") if recommended_architecture else None,
            "unresolved_conditions": [item.label for item in missing_items],
            "capacity_formula": capacity.unicast_bandwidth_formula,
            "evidence_references": [reference.id for reference in official_references],
            "rule_version": version,
            "capability_registry_version": registry_meta["version"],
        },
        requires_engineer_review=True,
        rule_version=version,
    )
    return response, trace


def recommend(req: CustomerRequirements) -> RecommendationResponse:
    response, _ = build_recommendation(req)
    return response
