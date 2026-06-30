# Production Deployment Checklist

## Repository Security

- [ ] `.env` is not tracked
- [ ] `frontend/.env.local` is not tracked
- [ ] No API keys are present in tracked files
- [ ] Git history has been checked for old real secrets
- [ ] No local database file is committed
- [ ] No generated reports are committed

## Backend

- [ ] PostgreSQL `DATABASE_URL` is configured
- [ ] `alembic upgrade head` completed successfully
- [ ] `OPENAI_API_KEY` is set only on the backend host
- [ ] `OPENAI_MODEL` is set to `gpt-5.4-mini`
- [ ] `/api/health` returns `ok`
- [ ] `CORS_ORIGINS` matches the deployed frontend URL
- [ ] Production logging is enabled
- [ ] Rate limiting is enabled

## Frontend

- [ ] `NEXT_PUBLIC_API_BASE_URL` points to the public backend URL
- [ ] `npm run build` succeeds
- [ ] `npm run build:cloudflare` succeeds
- [ ] Cloudflare deployment succeeds
- [ ] No browser requests go to `127.0.0.1`
- [ ] Report download works

## Cloudflare

- [ ] Workers URL is active
- [ ] Custom domain is configured if needed
- [ ] TLS is active
- [ ] Turnstile or Access is configured where required
- [ ] Observability is enabled

## Application

- [ ] Guided configuration works
- [ ] AI extraction works
- [ ] Recommendation generation works
- [ ] Lead saving works
- [ ] Report generation works
- [ ] Retry and error states work
- [ ] Mobile layout works

## Privacy

- [ ] Consent is required before saving personal data
- [ ] Retention policy text is defined
- [ ] Database backups are configured
- [ ] Data deletion process is documented
