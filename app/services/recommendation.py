from __future__ import annotations

from dataclasses import dataclass

from app.schemas import (
    CustomerRequirements,
    DeliveryMode,
    ProductRecommendation,
    ProjectType,
    RecommendationResponse,
    RuleTraceEntry,
    Service,
    SignalSource,
    ViewerDevice,
)
from app.services.capacity import estimate_capacity
from app.services.rules import load_rules


@dataclass
class RuleMatch:
    matched: bool
    passed: list[str]
    failed: list[str]


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


def _missing_information(req: CustomerRequirements) -> list[str]:
    missing: list[str] = []
    if req.expected_concurrent_viewers is None:
        missing.append("Expected concurrent viewers")
    if req.country is None:
        missing.append("Deployment country")
    if req.budget_range is None:
        missing.append("Budget range")
    if req.target_launch_date is None:
        missing.append("Target launch date")
    if req.archive_days > 0 and req.available_storage_tb is None:
        missing.append("Available storage capacity")
    return missing


def build_recommendation(req: CustomerRequirements) -> tuple[RecommendationResponse, list[RuleTraceEntry]]:
    rules_config = load_rules()
    version = rules_config["version"]
    rules = rules_config["rules"]
    recommendations: list[ProductRecommendation] = []
    trace: list[RuleTraceEntry] = []
    seen_products: set[str] = set()

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
        if match.matched and rule["product_family"] not in seen_products:
            seen_products.add(rule["product_family"])
            recommendations.append(
                ProductRecommendation(
                    product=rule["product_family"],
                    category=rule["category"],
                    reason=rule["recommendation_reason"],
                    rule_id=rule["rule_id"],
                    warning=rule.get("warning"),
                )
            )

    warnings = [
        "This configurator provides a preliminary recommendation. Final equipment, licensing, capacity, compatibility, redundancy, and pricing must be validated by a NetUP engineer.",
        "All current product thresholds in this MVP are provisional and require NetUP validation.",
    ]
    if req.redundancy_required:
        warnings.append("Redundant architecture was requested and requires separate failover validation.")
    if req.output_type.value == "dvb_c_qam":
        warnings.append("DVB-C/QAM output requires confirmation of modulation and regional plant compatibility.")

    capacity = estimate_capacity(req)
    assumptions = list(capacity.assumptions)

    response = RecommendationResponse(
        project_summary=(
            f"{req.project_type.value.replace('_', ' ').title()} project for "
            f"{req.subscribers_or_rooms} rooms/subscribers, "
            f"{req.number_of_channels} channels and {req.delivery_mode.value} delivery."
        ),
        recommendations=recommendations,
        capacity=capacity,
        warnings=warnings,
        missing_information=_missing_information(req),
        assumptions=assumptions,
        rule_version=version,
    )
    return response, trace


def recommend(req: CustomerRequirements) -> RecommendationResponse:
    response, _ = build_recommendation(req)
    return response

