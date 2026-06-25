# NetUP AI Presales Configurator

Production-oriented MVP for structured NetUP IPTV/OTT presales intake. The system combines a deterministic FastAPI recommendation backend with a Next.js customer-facing frontend and an optional OpenAI-powered conversational extraction path.

## Architecture

- `app/`: FastAPI backend, deterministic rules engine, capacity calculator, AI extraction, persistence, reports
- `config/product_rules.yaml`: versioned product-family rules that require NetUP validation
- `frontend/`: Next.js App Router UI for the wizard, conversational intake, results, and report preview
- `alembic/`: migration scaffold
- `docs/`: architecture, rule, AI safety, and NetUP validation references

## Local setup

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cmd /c npm install
cmd /c npm run dev
```

Backend runs at `http://127.0.0.1:8000`
Frontend runs at `http://127.0.0.1:3000`

## Environment variables

See `.env.example`.

Key values:

- `DATABASE_URL`: SQLite by default, PostgreSQL supported in production
- `OPENAI_API_KEY`: enables conversational extraction
- `OPENAI_MODEL`: defaults to `gpt-4.1-mini`
- `CORS_ORIGINS`: comma-separated frontend origins
- `NEXT_PUBLIC_API_BASE_URL`: frontend backend URL

## AI-disabled mode

If `OPENAI_API_KEY` is empty:

- `/api/conversation/extract` stays available
- the endpoint returns `ai_available: false`
- the UI clearly explains that conversational extraction is disabled
- the guided questionnaire remains fully operational

## Commands

```bash
make install
make dev
make test
make lint
make migrate
make seed
make docker-up
```

On Windows without `make`, run the underlying commands from the `Makefile`.

## Tests

Backend:

```bash
pytest -q
```

Frontend:

```bash
cd frontend
cmd /c npm test
cmd /c npm run build
```

## Docker

```bash
copy .env.example .env
docker compose up --build
```

## Example request

```bash
curl -X POST "http://127.0.0.1:8000/recommend" ^
  -H "Content-Type: application/json" ^
  --data @example_request.json
```

## Known limitations

- Current product thresholds are provisional and require NetUP validation.
- Report generation currently uses printable HTML rather than system-PDF rendering.
- Lead and report persistence use SQLite by default locally.
- Frontend tests cover key flows but are not a browser-driven E2E suite.

## Deployment guidance

- Use PostgreSQL through `DATABASE_URL`
- keep `OPENAI_API_KEY` server-side only
- set restrictive `CORS_ORIGINS`
- review NetUP validation checklist before customer launch
- place the frontend behind TLS and route API traffic to the FastAPI backend
