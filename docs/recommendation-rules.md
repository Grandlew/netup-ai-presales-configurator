# Recommendation Rules

Rules live in `config/product_rules.yaml`.

Each rule contains:

- `rule_id`
- `product_family`
- `category`
- `enabled`
- `conditions`
- `recommendation_reason`
- `warning`
- `source_reference_placeholder`
- `validation_status`

Current MVP notes:

- All sizing thresholds are provisional.
- All product recommendations are surfaced as product families, not final BOMs.
- Duplicate recommendations are suppressed even when multiple rules match the same family.
- Rule version `2026.06-mvp` is returned with each recommendation response.

Condition types currently supported:

- `min`
- `max`
- `in`
- `contains_any`
- `contains_all`
- `equals`
