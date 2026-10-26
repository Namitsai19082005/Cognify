# Architecture

## Current foundation

The application is a single npm workspace repository:

```text
Browser
  └─ React + Vite client
       └─ /api requests through the Vite development proxy
            └─ Express API
                  ├─ shared Zod contracts
                  ├─ Gemini structured-output adapter
                  └─ Mongoose → MongoDB Atlas
```

The API currently exposes `GET /api/health/live` as a process liveness check. The client displays whether it can reach this endpoint.

## Planned course-generation flow

```text
Topic form
  → shared Zod request validation
  → Gemini structured JSON outline
  → shared Zod output validation (one bounded repair attempt)
  → MongoDB persistence
  → course and lesson views
```

`POST /api/courses` accepts a topic and optional learner level. The server treats the topic as untrusted input, requests exactly three modules with three lessons each, and persists only an outline that passes the shared schema. If the first response fails JSON parsing or schema validation, the adapter makes one repair request and validates again; it does not save a second invalid response. `GET /api/courses/:courseId` validates the identifier before reading the stored course. Detailed lesson content will be generated on demand and saved to the selected lesson in a later milestone. Gemini and MongoDB credentials remain on the server and are supplied through environment variables.

