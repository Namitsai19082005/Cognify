# Text to Learn

Text to Learn turns a topic into a saved course outline and generates detailed lesson content on demand. The React client uses an Express API, Gemini structured output, shared Zod contracts, and MongoDB.

## Local setup

Prerequisites: Node.js **24.22.1** and npm 10 or later.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev:server
```

Start the client in a second terminal:

```powershell
npm run dev:client
```

Open the Vite URL printed in the client terminal. For a live app, set `GEMINI_API_KEY` and `MONGODB_URI` in the root `.env`. The root `.env` file is ignored by Git. Keep both values server-side and out of prompts, screenshots, and logs.

The client uses Vite's `/api` development proxy locally. The deployed client can use a separate API origin through `VITE_API_URL`; see [deployment setup](docs/deployment.md).

## Application flow

1. Enter a topic and learner level.
2. The API validates the request, asks Gemini for a structured outline, validates the result, and stores the course.
3. Open any lesson to generate structured lesson content and four interactive quiz questions.
4. Reload or share the course URL to retrieve the saved outline and generated lessons.

Each course contains three modules with three lessons each. Lesson content is generated only when requested and cached in MongoDB for later visits.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health/live` | Process liveness check |
| `GET` | `/api/health/ready` | Database readiness check |
| `POST` | `/api/courses` | Generate and save a course outline |
| `GET` | `/api/courses/:courseId` | Load a saved course |
| `POST` | `/api/courses/:courseId/lessons/:lessonId/content` | Generate or reuse lesson content |

Create a course with `{"topic":"Zero Trust network security","level":"beginner"}`. `level` is optional and defaults to `beginner`; accepted values are `beginner`, `intermediate`, and `advanced`.

## Security and operations

- Helmet sets standard HTTP security headers.
- CORS allows only the exact origins listed in `CLIENT_ORIGINS` (or the compatible `CLIENT_ORIGIN` setting). Separate origins with commas and omit paths and trailing slashes.
- Course and lesson generation share a limit of 10 requests per client IP per hour by default. Configure `GENERATION_RATE_LIMIT_MAX` and `GENERATION_RATE_LIMIT_WINDOW_MS` for a different limit.
- `TRUST_PROXY_HOPS` defaults to `0`. The Render Blueprint sets it to `1` so rate limiting can use the client IP forwarded through Render's proxy.
- JSON request bodies are limited to 16 KB. Request IDs are returned in `X-Request-Id` and included in JSON request/error logs. Logs omit prompts, request bodies, secrets, and raw provider responses.
- The rate limiter uses a process-local store. It resets when the server restarts and is not shared across multiple instances; use a shared store before scaling horizontally.
- CORS is a browser access policy, not API authentication. This demo has no accounts or private course ownership; anyone who has a course ID can read that course.
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
