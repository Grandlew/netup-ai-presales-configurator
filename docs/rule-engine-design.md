# Rule Engine Design

The audited engine now resolves recommendations in this order:

1. Normalize submitted requirements.
2. Derive required capabilities from project facts.
3. Match provisional repository rules for candidate discovery.
4. Resolve the core architecture path.
5. Detect functional overlap.
6. Remove duplicated coverage or escalate unresolved conflicts.
7. Apply capacity and compatibility readiness gates.
8. Emit a customer-facing recommendation plus an internal audit trace.

## Rule classes

- Eligibility rules: whether a product can serve the use case at all.
- Requirement rules: what the project needs functionally.
- Coverage rules: which product can provide each required capability.
- Conflict rules: where two products overlap or clash.
- Sizing rules: whether current scale fits a provisional boundary.
- Completeness rules: what critical data is still missing.
- Escalation rules: when NetUP engineering review is mandatory.

## Current hotel-specific behavior

- Existing headend equipment can shift the recommendation toward `NetUP.tv Hotel Software`.
- `NetUP DVB IP Streamer` is removed when `IPTV Combine 8x/16x` already covers the same DVB/IP headend function for the current baseline.
- Catch-up TV without retention and recording scope blocks final storage sizing.
- Smart TV delivery remains conditional until hospitality-model compatibility is confirmed.
