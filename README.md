# NetUP AI Presales Configurator

Production-oriented MVP for structured NetUP IPTV/OTT presales intake. The backend stays deterministic for recommendation logic, while the frontend can now be deployed to Cloudflare Workers through OpenNext and the FastAPI API can be deployed independently on Render or another Python host.

## Architecture

- `frontend/`: Next.js App Router UI, deployable to Cloudflare Workers with OpenNext
- `app/`: FastAPI API, deterministic rules engine, AI extraction, persistence, reports
- `alembic/`: database migrations
- `config/`: product rules and capabilities
- `docs/`: deployment and validation guidance

Target production shape:

```text
Browser
  -> Cloudflare-hosted Next.js frontend
  -> Public FastAPI backend
     -> OpenAI Responses API
     -> Managed PostgreSQL
     -> Report storage in PostgreSQL
```

## Local Development

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Local defaults:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:3000`

## Environment Variables

Backend variables are documented in `.env.example`.

Key backend values:

- `APP_ENV`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RATE_LIMIT_REQUESTS`
- `RATE_LIMIT_WINDOW_SECONDS`
- `MAX_MESSAGE_LENGTH`
- `BANDWIDTH_OVERHEAD_PERCENT`
- `BANDWIDTH_SAFETY_MARGIN_PERCENT`
- `ARCHIVE_OVERHEAD_PERCENT`
- `ARCHIVE_SAFETY_MARGIN_PERCENT`
- `ARCHIVE_REDUNDANCY_FACTOR`
- `ARCHIVE_RECORDING_RATIO`
- `REPORT_OUTPUT_DIR`
- `PRODUCT_RULES_PATH`
- `DATA_RETENTION_NOTE`

Frontend variables:

- `NEXT_PUBLIC_API_BASE_URL`

`OPENAI_API_KEY` belongs only on the backend host.

## Production Deployment

### Backend

- Render blueprint: `render.yaml`
- Health endpoint: `/api/health`
- Migration command: `alembic upgrade head`
- Production start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers
```

### Frontend

- OpenNext config: `frontend/open-next.config.ts`
- Wrangler config: `frontend/wrangler.jsonc`
- Cloudflare build:

```bash
cd frontend
npm run build:cloudflare
```

### Step-by-step Docs

- Render: [docs/deployment-render.md](docs/deployment-render.md)
- Cloudflare: [docs/deployment-cloudflare.md](docs/deployment-cloudflare.md)
- Production checklist: [docs/production-deployment-checklist.md](docs/production-deployment-checklist.md)

## Public API Endpoints

- `GET /api/health`
- `POST /api/recommend`
- `POST /recommend` (legacy compatibility route)
- `POST /api/conversation/extract`
- `GET /api/products`
- `GET /api/config/options`
- `POST /api/leads`
- `GET /api/leads/{lead_id}`
- `POST /api/reports`
- `GET /api/reports/{report_id}`
- `GET /api/reports/{report_id}/download?format=pdf|doc`

## Validation Commands

Backend:

```bash
pytest -q
python -m compileall app
alembic check
```

Frontend:

```bash
cd frontend
npm test
npm run typecheck
npm run build
npm run build:cloudflare
```

## Security Notes

- Do not commit `.env`, local DB files, generated reports, `.next`, `.wrangler`, or `node_modules`.
- Do not expose `OPENAI_API_KEY` to the frontend.
- Do not use wildcard CORS in production.
- Reports are persisted in the database so they survive backend restarts.
- Lead submission requires consent before persistence.
- Cloudflare Turnstile is documented as the next hardening step; it is not enforced by this pass.
