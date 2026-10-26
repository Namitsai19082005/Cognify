# Text to Learn

Text to Learn is a full-stack course generator project. The first milestone establishes the React client, Express API, shared package, and local development workflow. Course generation and persistence are planned for the next milestones.

## Prerequisites

- Node.js 24 LTS
- npm 10 or later

The repository pins Node 24 in `.nvmrc` and `.node-version`. The current development environment reports Node 20.15.1; switch to Node 24 before installing dependencies because the current Vite release requires a newer Node 20 or Node 22 runtime.

## Local setup

```powershell
npm install
npm run dev:server
```

In a second terminal, start the client:

```powershell
npm run dev:client
```

Open the Vite URL printed in the client terminal. The client checks the API at `/api/health/live`; Vite proxies that request to the Express server on port 5000.

Copy `.env.example` to an ignored local `.env` file when adding database or AI credentials. Never commit `.env` or paste secret values into coding-agent prompts.

## Course API

The API validates course requests, asks Gemini for a structured outline, validates the result with the shared schema, and stores valid courses in MongoDB. Gemini and MongoDB credentials stay on the server.

```http
GET  /api/health/live
GET  /api/health/ready
POST /api/courses
GET  /api/courses/:courseId
```

Create a course with `{"topic":"Zero Trust network security","level":"beginner"}`. `level` is optional and defaults to `beginner`; accepted levels are `beginner`, `intermediate`, and `advanced`. Outlines contain exactly three modules with three lessons each. Each lesson includes objectives, key topics, and plain-text resource suggestions.

Set `GEMINI_API_KEY` and `MONGODB_URI` in the root `.env` file. `GEMINI_MODEL` defaults to `gemini-3.8-flash`. The API makes one bounded repair request if Gemini returns malformed JSON or an outline that fails schema validation, and saves nothing unless the final outline is valid. The readiness endpoint returns `503` while MongoDB is disconnected; liveness remains available so the API can still be diagnosed.

Invalid input returns `400`; unavailable MongoDB or missing Gemini configuration returns `503`; provider failures and invalid model output return a safe `502` response. Provider response bodies and credentials are not returned to the client.

## Workspace layout

- `client/` — React and Vite application
- `server/` — Express API
- `shared/` — code and validation contracts shared between the client and API
- `docs/` — architecture and development notes

## Quality commands

```powershell
npm run lint
npm test
npm run build
```

## Git workflow

Use a small feature branch for each change, open a pull request, and run the quality commands before merging to `main`. Review AI-generated changes before merging them.

