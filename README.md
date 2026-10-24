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

