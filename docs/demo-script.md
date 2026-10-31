# 3–5 minute demo walkthrough

Use the live site only after following [deployment setup](deployment.md) and completing the [acceptance checklist](acceptance-checklist.md). If cloud credentials are not configured, use the local sample demo and label its responses as sample data.

## Walkthrough

### 0:00–0:30 — Problem and outcome

“Text to Learn turns a learner's topic into a structured course and generates a full lesson only when the learner asks for it. I focused the project on safe AI integration, API reliability, and a short path from prompt to saved learning content.”

### 0:30–1:00 — Architecture

Show the architecture diagram in `docs/architecture.md`. Point out the React/Vite client, Express API, shared Zod contracts, Gemini adapter, and MongoDB persistence. Explain that the Gemini and database credentials stay on the server.

### 1:00–2:00 — Create a course

Enter **Zero Trust network security** at **Beginner** level. Show the generated modules and lesson objectives. Briefly explain that the API validates the request and generated outline before saving it, and performs at most one bounded repair attempt for invalid model output.

### 2:00–3:15 — Generate a lesson

Choose a lesson and select **Generate detailed lesson**. Show the headings, explanation, video search suggestion, code example if present, and quiz. Answer one question to show the feedback. Refresh the page and explain that the course ID retrieves the saved lesson; a repeat generate request uses the cached content.

### 3:15–4:15 — Engineering safeguards

Show the GitHub Actions run and explain that CI runs lint, API tests, a MongoDB persistence integration check, and production builds without calling Gemini. Mention Helmet headers, exact-origin CORS, request IDs, structured logs, the 16 KB JSON-body limit, and the generation rate limit.

### 4:15–5:00 — Tradeoffs and close

State the current limits plainly: courses are public to anyone with their ID, and the in-memory rate limiter is for a single API instance. Explain that authentication and a shared rate-limit store are follow-up work if private accounts or horizontal scaling are needed. Close with the live acceptance results and repository link.

## Recording notes

- Use a course created for the demo and remove secrets from browser developer tools and terminal output.
- Keep the deployed API readiness check green before recording; a sleeping or disconnected database can make generation fail.
- Do not describe resource suggestions as verified links.
- Do not claim a live deployment, measured performance improvement, or test result that has not been verified.
