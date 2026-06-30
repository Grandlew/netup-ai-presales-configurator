# Cloudflare OpenNext Deployment

## What Goes Where

- Build-time public variable:
  - `NEXT_PUBLIC_API_BASE_URL`
- Worker runtime variables:
  - None required for the current MVP frontend
- Backend-only secrets:
  - `OPENAI_API_KEY`
  - Database passwords
  - Turnstile secret if added later

## Exact Deployment Steps

1. Push the latest repository to GitHub.
2. Open the Cloudflare Dashboard.
3. Go to `Workers & Pages`.
4. Create or import the GitHub repository.
5. Select the production branch.
6. Set the root directory to `frontend` if Cloudflare asks for it.
7. Set the build command to `npm run build:cloudflare`.
8. Set the deploy command to `npx wrangler deploy`.
9. Set `NEXT_PUBLIC_API_BASE_URL` to the backend URL, for example `https://netup-presales-api.onrender.com`.
10. Deploy the Worker.
11. Obtain the generated `workers.dev` URL, for example `https://netup-presales-configurator.<account>.workers.dev`.
12. Add that exact URL to the backend `CORS_ORIGINS`.
13. Redeploy the backend on Render.
14. Test the full flow:

- Home page loads
- Guided configurator works
- AI extraction works when the backend has `OPENAI_API_KEY`
- Recommendation generation works
- Lead saving works
- Report generation and download work

15. Add a custom domain when ready.
16. Update backend `CORS_ORIGINS` to `https://configurator.example.com`.
17. Redeploy the backend again.
18. Re-test over HTTPS on the custom domain.
19. Configure Cloudflare Access for staging or reviewer-only deployments when needed.
20. Configure Cloudflare Turnstile for public forms when you are ready to enforce bot protection.

## Local OpenNext Commands

```bash
cd frontend
npm run build:cloudflare
npm run preview:cloudflare
```

## Wrangler Notes

- Config file: `frontend/wrangler.jsonc`
- OpenNext config: `frontend/open-next.config.ts`
- Worker entry: `.open-next/worker.js`
- Static assets binding: `ASSETS`

## Custom Domain Steps

1. If the domain is not already on Cloudflare, add the domain to Cloudflare first.
2. Open the deployed Worker.
3. Go to `Domains & Routes`.
4. Choose `Add custom domain`.
5. Enter `configurator.example.com`.
6. Let Cloudflare create or validate the required DNS records.
7. Wait for TLS issuance and HTTPS readiness.
8. Update backend `CORS_ORIGINS` to the custom domain.
9. Redeploy the backend.
10. Verify the site over HTTPS.

The `workers.dev` URL is enough to launch the MVP before buying or connecting a custom domain.

## Security Add-Ons

### Turnstile

- Protect:
  - AI extraction
  - Lead submission
  - Engineering-review requests
  - Report generation if abuse appears
- This repository pass documents the integration path but does not enable live Turnstile verification yet.
- Frontend should collect a Turnstile token.
- Backend must validate the token server-side.
- Keep the Turnstile secret in Render, not Cloudflare frontend config.
- Keep local development able to bypass Turnstile with an explicit environment switch.

### Access

- Use Cloudflare Access to lock a staging Worker to selected NetUP reviewers.

### Rate Limiting

- Keep the FastAPI rate limit middleware enabled.
- Add Cloudflare edge rate limiting as a second layer for public traffic.
