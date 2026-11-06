# Text to Learn

Text to Learn turns a topic into a saved course outline and generates detailed lesson content on demand. The React client uses an Express API, Gemini structured output, shared Zod contracts, and MongoDB.

## Local setup

Prerequisites: Node.js **24.22.1** and npm 10 or later.

```powershell
npm ci
Copy-Item .env.example .env
Copy-Item client\.env.example client\.env.local
npm run dev:server
```

Start the client in a second terminal:

```powershell
npm run dev:client
```

Open the Vite URL printed in the client terminal. Set up an Auth0 Single Page Application and an API with identifier `https://text-to-learn-api`. In Auth0, allow `http://localhost:5173` as a callback, logout, and web origin. Put the Auth0 domain, SPA client ID, and API audience in `client/.env.local`; put `AUTH0_ISSUER_BASE_URL`, `AUTH0_AUDIENCE`, `GEMINI_API_KEY`, and `MONGODB_URI` in the root `.env`. The example files contain placeholders, and both local env files are ignored by Git. Keep `GEMINI_API_KEY` and `MONGODB_URI` server-side and out of prompts, screenshots, and logs.

The client uses Vite's `/api` development proxy locally. The deployed client can use a separate API origin through `VITE_API_URL`; see [deployment setup](docs/deployment.md).

## Application flow

1. Enter a topic and learner level.
2. The API validates the request, asks Gemini for a structured outline, validates the result, and stores the course.
3. Open any lesson to generate structured lesson content and four interactive quiz questions.
4. Open the **Course library** to revisit courses saved in this browser, or reload/share a course URL to retrieve its saved outline and generated lessons.

Each course contains three modules with three lessons each. Lesson content is generated only when requested and cached in MongoDB for later visits.

The client uses Auth0 sign-in and routes for course overviews and individual lessons. Course API calls send an Auth0 access token, and the browser stores course shortcuts in a separate local list for each signed-in account. Server-side course ownership and cross-device sync are planned follow-up work.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health/live` | Process liveness check |
| `GET` | `/api/health/ready` | Database readiness check |
| `POST` | `/api/courses` | Generate and save a course outline (Auth0 bearer token required) |
| `GET` | `/api/courses/:courseId` | Load a saved course (Auth0 bearer token required) |
| `POST` | `/api/courses/:courseId/lessons/:lessonId/content` | Generate or reuse lesson content (Auth0 bearer token required) |

Create a course with `{"topic":"Zero Trust network security","level":"beginner"}`. `level` is optional and defaults to `beginner`; accepted values are `beginner`, `intermediate`, and `advanced`.

## Security and operations

- Helmet sets standard HTTP security headers.
- CORS allows only the exact origins listed in `CLIENT_ORIGINS` (or the compatible `CLIENT_ORIGIN` setting). Separate origins with commas and omit paths and trailing slashes.
- Course and lesson generation share a limit of 10 requests per client IP per hour by default. Configure `GENERATION_RATE_LIMIT_MAX` and `GENERATION_RATE_LIMIT_WINDOW_MS` for a different limit.
- `TRUST_PROXY_HOPS` defaults to `0`. The Render Blueprint sets it to `1` so rate limiting can use the client IP forwarded through Render's proxy.
- JSON request bodies are limited to 16 KB. Request IDs are returned in `X-Request-Id` and included in JSON request/error logs. Logs omit prompts, request bodies, secrets, and raw provider responses.
- The rate limiter uses a process-local store. It resets when the server restarts and is not shared across multiple instances; use a shared store before scaling horizontally.
- Auth0 validates signed access tokens on course API routes. Course ownership checks are not implemented yet, so any signed-in user who knows a course ID can read it; do not treat course data as private until ownership checks are added.
- Missing configuration returns a safe service error. Provider output is validated before persistence, and provider details are not sent to the browser.

## Checks and CI

```powershell
npm run lint
npm test
npm run build
```

GitHub Actions runs those checks for pushes and pull requests. Gemini is mocked in the tests; the MongoDB integration check runs against a disposable MongoDB service in CI. To run that integration check locally, set `MONGODB_TEST_URI` to a disposable test database before running `npm test`. Without it, the integration check is skipped and the security/API tests still run.

## Hosting

The repository includes a Render Blueprint for the Express API and a Vercel configuration for the Vite client. Create the services after connecting the repository, then add the API and database secrets in the hosting dashboards. The Render health check uses `/api/health/live`; the React app uses `VITE_API_URL` to contact the API. Follow the step-by-step [deployment guide](docs/deployment.md).

## Demo and acceptance

Use the [demo walkthrough](docs/demo-script.md) to present the learner flow and the [acceptance checklist](docs/acceptance-checklist.md) before recording or sharing a live demo.

## Workspace layout

- `client/` — React and Vite application
- `server/` — Express API, Gemini adapters, MongoDB model, and API tests
- `shared/` — Zod contracts shared between the client and API
- `docs/` — architecture, deployment, acceptance, and demo notes
