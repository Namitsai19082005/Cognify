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

The API exposes `GET /api/health/live` for process liveness and `GET /api/health/ready` for database readiness. The client checks readiness before showing the generation form's service status.

## Planned course-generation flow

```text
Topic and level form
  → shared Zod request validation in browser and API
  → Gemini structured JSON outline
  → shared Zod output validation (one bounded repair attempt)
  → MongoDB persistence
  → course and lesson outline views
  → course link reloads through GET /api/courses/:courseId
```

`POST /api/courses` accepts a topic and optional learner level. The browser validates with the shared request schema, and the server repeats validation before processing the untrusted topic. The server requests exactly three modules with three lessons each and persists only an outline that passes the shared response schema. If the first response fails JSON parsing or schema validation, the adapter makes one repair request and validates again; it does not save a second invalid response. `GET /api/courses/:courseId` validates the identifier before reading the stored course. The React client renders course objectives and the syllabus, and stores the selected course ID in the query string so a reload fetches the persisted course again. Detailed lesson content will be generated on demand and saved to the selected lesson in a later milestone. Gemini and MongoDB credentials remain on the server and are supplied through environment variables.

## Day 4 browser experience

`client/src/api/courses.js` is the browser boundary for readiness checks, course creation, and course retrieval. It validates requests and API responses with the shared Zod contracts. The home page reports loading and service errors, while the course overview presents module accordions with each lesson's objectives, key topics, and plain-text resource suggestions. The layout is responsive and uses native form controls and `<details>` elements for keyboard-accessible interaction.

