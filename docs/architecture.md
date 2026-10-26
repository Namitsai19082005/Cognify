# Architecture

## Current foundation

The application is a single npm workspace repository:

```text
Browser
  └─ React + Vite client
       └─ /api requests through the Vite development proxy
            └─ Express API
```

The API currently exposes `GET /api/health/live` as a process liveness check. The client displays whether it can reach this endpoint.

## Planned course-generation flow

```text
Topic form
  → shared Zod request validation
  → course outline provider
  → shared schema validation
  → MongoDB persistence
  → course and lesson views
```

The Day 2 provider returns a deterministic fixture so the API and persistence boundary can be developed before the external AI dependency. Day 3 replaces it with Gemini structured generation. Detailed lesson content will be generated on demand and saved to the selected lesson. Gemini and MongoDB credentials remain on the server and are supplied through environment variables.

