# NetUP AI Presales Configurator Implementation Plan

## Audit summary

The repository is already in a stronger state than a typical MVP. The current codebase has clear separation between:

- deterministic backend recommendation logic in `app/services/recommendation.py`
- capacity estimation in `app/services/capacity.py`
- rule loading and capability references
- a Next.js frontend with guided and natural-language intake flows
- report generation, persistence scaffolding, tests, and production deployment docs

The most important remaining gap is not basic functionality. It is production trust:

- the AI extraction flow returns values, but not field-level evidence or confidence
- the review screen reconstructs traceability heuristically in the browser instead of consuming backend truth
- recommendation explanations are mostly hard-coded narrative blocks rather than reusable structured rationale
- PDF output is serviceable but still closer to a formatted export than a polished executive deliverable
- persistence, authentication, and admin rule management remain early-stage or absent

## Current strengths

- deterministic recommendation engine with explicit rules and audit trace
- preliminary architecture modeling and evidence references
- human-readable results and report generation
- test coverage across API, extractor, wizard, and results flows
- deployment guidance for Render and Cloudflare

## Risks and gaps

### Product trust and explainability

- Natural-language intake does not yet provide backend-owned source traceability per field.
- The current review flow can show inferred items, but the inference logic lives in the frontend and is not authoritative.
- User corrections made during review are not yet represented as a first-class audit object that can flow into persistence and later QA.

### Recommendation rigor

- Product reasons are still partly hand-authored branches instead of normalized explanation templates backed by rule and capability evidence.
- Capacity math is exposed, but supporting assumptions are not yet grouped into a reusable calculation breakdown suitable for future admin review and PDF rendering.

### Operational maturity

- PostgreSQL is wired for runtime use, but longitudinal project history, review actions, and audit records are not yet modeled as a durable workflow.
- Authentication and role boundaries are not yet present for internal reviewers or administrators.
- Rule editing remains file-based rather than governed through an admin surface with change control.

### Delivery polish

- The PDF export needs stronger layout hierarchy, cleaner calculation presentation, and a clearer architecture section.
- The architecture view is useful, but it is not yet backed by a dedicated diagram artifact that can be reused across report channels.

## Implementation phases

### Phase 1: Trusted intake foundation

Goal: make extraction review auditable and safe enough for production presales use.

1. Add strict extraction trace schema from backend.
2. Return field-level confidence, source text, inferred status, and confirmation requirement.
3. Move deterministic inferred suggestions from frontend heuristics into backend-owned review metadata.
4. Persist review audit state in a structured shape that can later be stored in PostgreSQL.
5. Expand extractor tests for malformed output, merge behavior, and trace metadata.

### Phase 2: Recommendation transparency

Goal: make every recommendation easier to defend internally and externally.

1. Refactor recommendation explanations into deterministic templates tied to selected capabilities and matched rules.
2. Extend `audit_trace` with explanation fragments, rejected alternatives, and calculation inputs.
3. Normalize missing-information severity and quotation-readiness criteria.
4. Add tests for explanation consistency and overlap resolution.

### Phase 3: Human review and report quality

Goal: improve presales usability without changing the deterministic backend model.

1. Upgrade the review screen to consume backend traceability directly.
2. Make explicit accept, reject, and edit actions visible per inferred field.
3. Improve PDF structure with stronger executive summary, assumptions, calculations, and architecture sections.
4. Add a dedicated architecture diagram representation that can be reused in UI and exports.

### Phase 4: Persistence and internal workflow

Goal: support real presales operations instead of single-session generation.

1. Add PostgreSQL models for extracted intake, review decisions, recommendations, and generated reports.
2. Introduce authenticated internal access for review history and lead lookup.
3. Model rule/config versioning alongside recommendation snapshots.
4. Add migration coverage and repository tests around persistence workflows.

### Phase 5: Admin and governance

Goal: let internal teams manage recommendation logic safely.

1. Build authenticated admin rule management.
2. Add validation, preview, and version history for rule changes.
3. Add role-based access boundaries for reviewer vs admin actions.
4. Add deployment hardening checks for secrets, CORS, health, and environment validation.

## Immediate execution order

The highest-value work for this pass is:

1. strict backend extraction trace schema
2. frontend review consumption of backend traceability
3. expanded tests for extraction and review behavior
4. follow-on recommendation explanation normalization if time remains

## Acceptance criteria for the current pass

- `docs/implementation-plan.md` exists and reflects the repository audit
- conversation extraction returns structured traceability metadata
- review UI uses backend-provided traceability for confirmed and inferred items
- tests cover the new API contract and the review rendering path
- existing recommendation flow remains intact
