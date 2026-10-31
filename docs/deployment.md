# Deployment setup

The app deploys as two services: a static React/Vite site on Vercel and the Express API on Render. MongoDB Atlas stores courses; Gemini is called only by the API.

## 1. Deploy the API on Render

1. Push the repository to GitHub and connect that repository in Render.
2. Create a new **Blueprint** and select the repository. Render reads the root `render.yaml` to create the Node web service.
3. Set the prompted environment variables in Render:
   - `MONGODB_URI`: the Atlas connection string for the application database.
   - `GEMINI_API_KEY`: the server-side Gemini key.
   - `CLIENT_ORIGINS`: the exact Vercel site origin, such as `https://text-to-learn.vercel.app`, with no path or trailing slash. If the Vercel URL is not known yet, use `http://localhost:5173` temporarily and replace it after deploying the client.
4. Confirm the service uses Node.js 24.22.1 and that its health check succeeds at `/api/health/live`.

The Blueprint sets the generation limit to 10 requests per IP per hour and trusts one proxy hop for Render's forwarded client IP. It does not contain database or AI credentials.

## 2. Deploy the client on Vercel

1. Import the same GitHub repository as a Vercel project. Keep the project root at the repository root so npm can install the `shared` workspace.
2. `vercel.json` sets the client build command and uses `client/dist` as the static output directory.
3. Add `VITE_API_URL` to the Vercel project's environment variables. Set it to the Render API origin, for example `https://text-to-learn-api.onrender.com`, without a trailing slash or `/api` path.
4. Redeploy the client after setting the variable; Vite embeds it during the build.
5. Copy the Vercel production origin into Render's `CLIENT_ORIGINS` setting and redeploy the API. Add any preview origin only when that preview needs API access.

## 3. Check the deployed services

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
| `CLIENT_ORIGINS` | Render | Comma-separated exact browser origins allowed by CORS |
| `TRUST_PROXY_HOPS` | Render | Set to `1` for the Render proxy; local default is `0` |
| `GENERATION_RATE_LIMIT_MAX` | Render | Generation requests allowed per IP and window; default `10` |
| `GENERATION_RATE_LIMIT_WINDOW_MS` | Render | Rate-limit window in milliseconds; default `3600000` |
| `VITE_API_URL` | Vercel | Render API origin used by the client at build time |
| `MONGODB_TEST_URI` | GitHub Actions or local tests | Disposable MongoDB database used by the persistence integration check |

Never add production values to `.env.example`, workflow YAML, or committed Vercel/Render configuration. Configure them in each provider's environment-variable dashboard.

## Deployment limits

- The application has no login or per-user course ownership. Treat course URLs as public to anyone who knows the ID.
- The default rate-limit store is in process memory. It resets on restart and does not coordinate multiple API instances. Add a shared store before horizontal scaling.
- The API uses exact-origin CORS to control browser access. CORS does not authenticate callers or block non-browser clients.
- The deployment files prepare both platforms; the first deployment still requires connecting the GitHub repo and entering the secrets above.
