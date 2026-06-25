# Architecture Overview

The NetUP AI Presales Configurator is split into two clear responsibilities:

- Frontend `frontend/`: a Next.js App Router interface for the guided wizard, conversational intake, results, lead submission, and printable report preview.
- Backend `app/`: a FastAPI service that validates requirements, applies deterministic product rules, calculates capacity, stores leads and reports, and optionally calls the OpenAI Responses API only for structured requirement extraction.

Flow:

1. Customer input arrives through the wizard or conversational intake.
2. The backend validates structured data with Pydantic.
3. The deterministic recommendation engine reads versioned rules from `config/product_rules.yaml`.
4. Capacity formulas run in `app/services/capacity.py`.
5. Results are returned with assumptions, missing information, and warnings.
6. Qualified leads and printable HTML reports are stored in SQLite locally or PostgreSQL via `DATABASE_URL` in production.

Design constraints:

- The LLM never selects NetUP products or performs infrastructure math.
- Every recommendation is marked preliminary and requires NetUP validation.
- Rule thresholds are externalized and versioned rather than hard-coded in API handlers.
