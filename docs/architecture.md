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
  → Express request validation
  → Gemini structured course outline
  → shared schema validation
  → MongoDB persistence
  → course and lesson views
```

Detailed lesson content will be generated on demand and saved to the selected lesson. Gemini and MongoDB credentials will remain on the server and will be supplied through environment variables.

