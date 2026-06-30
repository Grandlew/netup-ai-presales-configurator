# Render Deployment

## Architecture

- Frontend: Cloudflare Workers via OpenNext
- Backend: Render web service
- Database: Render PostgreSQL or another managed PostgreSQL provider
- DNS/TLS/edge: Cloudflare
- OpenAI key: Render secret only

## Files Used

- `render.yaml`
- `Dockerfile.backend`
- `.env.example`

## Render Blueprint Steps

1. Push the latest repository to GitHub.
2. In Render, choose `New +` -> `Blueprint`.
3. Select this repository.
4. Confirm the detected `render.yaml`.
5. Review the `netup-presales-api` web service and the PostgreSQL instance.
6. Create the blueprint.
7. Open the `netup-presales-api` service dashboard.
8. Confirm the `Build Command` is `pip install --upgrade pip && pip install -r requirements.txt`.
9. Confirm the `Pre-Deploy Command` is `alembic upgrade head`.
10. Confirm the `Start Command` is `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers`.
11. Confirm the health check path is `/api/health`.
12. Set or verify these environment variables in the Render dashboard:

- `APP_ENV=production`
- `DATABASE_URL=<managed PostgreSQL connection string>`
- `OPENAI_API_KEY=<secret>`
- `OPENAI_MODEL=gpt-5.4-mini`
- `CORS_ORIGINS=https://netup-presales-configurator.<account>.workers.dev`
- `RATE_LIMIT_REQUESTS=30`
- `RATE_LIMIT_WINDOW_SECONDS=60`
- `MAX_MESSAGE_LENGTH=2000`
- `REPORT_OUTPUT_DIR=generated_reports`
- `DATA_RETENTION_NOTE=<your approved retention statement>`

13. Mark `DATABASE_URL` and `OPENAI_API_KEY` as dashboard-managed secrets.
14. Trigger a deploy.
15. Wait for the pre-deploy migration step to finish.
16. Open `https://netup-presales-api.onrender.com/api/health` or your Render URL equivalent.
17. Verify the response is:

```json
{
  "status": "ok",
  "database": "ok",
  "ai_extraction": "enabled"
}
```

18. After the Cloudflare frontend URL is known, update `CORS_ORIGINS` to the exact frontend origin list and redeploy.
19. After the custom domain is live, replace the temporary Workers URL in `CORS_ORIGINS` with `https://configurator.example.com` and redeploy again.

## PostgreSQL Notes

- Production `DATABASE_URL` format:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

- Manual migration command:

```bash
alembic upgrade head
```

- Validation command used in CI:

```bash
alembic check
```

## Security Notes

- Do not place `OPENAI_API_KEY` in Cloudflare or frontend variables.
- Do not use wildcard CORS origins in production.
- Do not rely on Render local disk for durable reports; reports are stored in PostgreSQL.
- Configure regular PostgreSQL backups and a deletion workflow for lead data.
