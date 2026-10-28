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
  → on-demand lesson content generation and persistence
  → structured lesson renderer with interactive quizzes
  → course link reloads through GET /api/courses/:courseId
```

`POST /api/courses` accepts a topic and optional learner level. The browser validates with the shared request schema, and the server repeats validation before processing the untrusted topic. The server requests exactly three modules with three lessons each and persists only an outline that passes the shared response schema. If the first response fails JSON parsing or schema validation, the adapter makes one repair request and validates again; it does not save a second invalid response. `GET /api/courses/:courseId` validates the identifier before reading the stored course. The React client renders course objectives and the syllabus, and stores the selected course ID in the query string so a reload fetches the persisted course again. `POST /api/courses/:courseId/lessons/:lessonId/content` generates a lesson only on demand, validates its structured blocks, saves the blocks and timestamp to the selected embedded lesson, and reuses valid cached content on later requests. Gemini and MongoDB credentials remain on the server and are supplied through environment variables.

## Day 4 browser experience

`client/src/api/courses.js` is the browser boundary for readiness checks, course creation, and course retrieval. It validates requests and API responses with the shared Zod contracts. The home page reports loading and service errors, while the course overview presents module accordions with each lesson's objectives, key topics, and plain-text resource suggestions. The layout is responsive and uses native form controls and `<details>` elements for keyboard-accessible interaction.

## Day 5 lesson content

The lesson generator uses Gemini structured output for heading, paragraph, code, video-query, and multiple-choice blocks. Zod validates every block, while server-side semantic checks require explanatory text, one video search query, and four MCQs at the end of the lesson. Invalid first output receives one bounded repair attempt; invalid content is never persisted. The client renders code as escaped text, leaves video queries as search suggestions for a later integration, and lets learners select an answer and view feedback for each MCQ.

