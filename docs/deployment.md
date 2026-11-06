# Deployment setup

The app deploys as two services: a static React/Vite site on Vercel and the Express API on Render. MongoDB Atlas stores courses; Gemini is called only by the API.

## 1. Deploy the API on Render

1. Push the repository to GitHub and connect that repository in Render.
2. Create a new **Blueprint** and select the repository. Render reads the root `render.yaml` to create the Node web service.
3. Set the prompted environment variables in Render:
   - `MONGODB_URI`: the Atlas connection string for the application database.
   - `GEMINI_API_KEY`: the server-side Gemini key.
   - `CLIENT_ORIGINS`: the exact Vercel site origin, such as `https://text-to-learn.vercel.app`, with no path or trailing slash. If the Vercel URL is not known yet, use `http://localhost:5173` temporarily and replace it after deploying the client.
   - `AUTH0_ISSUER_BASE_URL`: the Auth0 tenant origin, such as `https://your-tenant.auth0.com` (no path or trailing slash).
   - `AUTH0_AUDIENCE`: the API identifier configured in Auth0, such as `https://text-to-learn-api`.
4. Confirm the service uses Node.js 24.22.1 and that its health check succeeds at `/api/health/live`.

The Blueprint sets the generation limit to 10 requests per IP per hour and trusts one proxy hop for Render's forwarded client IP. It does not contain database or AI credentials.

## 2. Deploy the client on Vercel

1. Import the same GitHub repository as a Vercel project. Keep the project root at the repository root so npm can install the `shared` workspace.
2. `vercel.json` sets the client build command and uses `client/dist` as the static output directory.
3. Add `VITE_API_URL` to the Vercel project's environment variables. Set it to the Render API origin, for example `https://text-to-learn-api.onrender.com`, without a trailing slash or `/api` path.
4. Add `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, and `VITE_AUTH0_AUDIENCE` using the Auth0 tenant domain, SPA client ID, and same API identifier used by Render.
5. Redeploy the client after setting these variables; Vite embeds them during the build.
6. Copy the Vercel production origin into Render's `CLIENT_ORIGINS` setting and redeploy the API. Add any preview origin only when that preview needs API access.

## 3. Configure Auth0

1. Create an Auth0 **Single Page Application** and an Auth0 **API** with identifier `https://text-to-learn-api` (or use another identifier consistently in both services).
2. Keep the API signing algorithm set to **RS256**.
3. In the SPA settings, add the local and deployed client origins to **Allowed Callback URLs**, **Allowed Logout URLs**, and **Allowed Web Origins**. Local development uses `http://localhost:5173`; use the actual Vercel origin for deployment.
4. Set the SPA domain and client ID in Vercel. Set the tenant issuer origin and API audience in Render. For local development, copy `client/.env.example` to `client/.env.local` and fill the three `VITE_AUTH0_*` values; put the matching issuer and audience in the root `.env`.

The API checks issuer, audience, expiry, and RS256 signature on course routes. Health endpoints remain public for hosting probes. A valid token identifies the signed-in user, but database ownership checks are a follow-up task; a signed-in user who knows a course ID can still read it.

## 4. Check the deployed services

Replace the example origins with the URLs shown in the hosting dashboards:

```powershell
Invoke-RestMethod https://text-to-learn-api.onrender.com/api/health/live
Invoke-RestMethod https://text-to-learn-api.onrender.com/api/health/ready
```

The liveness response can succeed while MongoDB is unavailable. The readiness response should report `database: connected` before course creation. Then open the Vercel site and follow [the demo walkthrough](demo-script.md). Use [the acceptance checklist](acceptance-checklist.md) to record the final checks.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Render | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Render | Gemini credential; never expose it to Vite |
| `GEMINI_MODEL` | Render | Model name; defaults to `gemini-3.8-flash` |
| `AUTH0_ISSUER_BASE_URL` | Render | Auth0 tenant issuer origin, for example `https://your-tenant.auth0.com` |
| `AUTH0_AUDIENCE` | Render, local server | Auth0 API identifier validated by the API |
| `CLIENT_ORIGINS` | Render | Comma-separated exact browser origins allowed by CORS |
| `TRUST_PROXY_HOPS` | Render | Set to `1` for the Render proxy; local default is `0` |
| `GENERATION_RATE_LIMIT_MAX` | Render | Generation requests allowed per IP and window; default `10` |
| `GENERATION_RATE_LIMIT_WINDOW_MS` | Render | Rate-limit window in milliseconds; default `3600000` |
| `VITE_API_URL` | Vercel | Render API origin used by the client at build time |
| `VITE_AUTH0_DOMAIN` | Vercel, local client | Auth0 tenant domain (host only, no scheme) |
| `VITE_AUTH0_CLIENT_ID` | Vercel, local client | Auth0 Single Page Application client ID |
| `MONGODB_TEST_URI` | GitHub Actions or local tests | Disposable MongoDB database used by the persistence integration check |

Never add production values to `.env.example`, workflow YAML, or committed Vercel/Render configuration. Configure them in each provider's environment-variable dashboard.

## Deployment limits

- Login uses Auth0, but per-user course ownership is not yet implemented. Treat course URLs as readable by any signed-in user who knows the ID.
- The default rate-limit store is in process memory. It resets on restart and does not coordinate multiple API instances. Add a shared store before horizontal scaling.
- The API uses exact-origin CORS to control browser access. CORS does not authenticate callers or block non-browser clients.
- The deployment files prepare both platforms; the first deployment still requires connecting the GitHub repo and entering the secrets above.
