# Acceptance checklist

Use this list before recording the demo or sharing the repository.

## Automated checks

- [ ] `npm run lint` passes.
- [ ] `npm test` passes. The MongoDB persistence check runs when `MONGODB_TEST_URI` points to a disposable MongoDB database; otherwise it is explicitly skipped.
- [ ] `npm run build` passes for the client and server.
- [ ] The GitHub Actions `CI` workflow passes for the branch or pull request.
- [ ] Tests use a mocked Gemini provider and make no paid model calls.

## API and security behavior

- [ ] `/api/health/live` reports process liveness.
- [ ] `/api/health/ready` reports database readiness and does not include credentials.
- [ ] A valid course request creates a 3-module, 9-lesson outline; invalid input returns a safe `400` response.
- [ ] Course and lesson IDs are validated before database reads.
- [ ] Generated lesson content is persisted, reloads with the course, and is reused on repeat generation requests.
- [ ] Invalid model output is not persisted; provider and database failures do not expose raw errors.
- [ ] Security headers are present, configured CORS origins match exactly, and every response includes an `X-Request-Id`.
- [ ] The generation limiter returns `429` after the configured per-IP quota. Automated coverage checks this without calling Gemini.
- [ ] Logs contain request IDs, paths, statuses, and durations, but no prompts, request bodies, keys, or provider response content.

## Deployed app

- [ ] Render reports the API as healthy at `/api/health/live`.
- [ ] Render readiness reports MongoDB connected at `/api/health/ready`.
- [ ] The Vercel client uses the configured Render API origin and loads without a CORS error.
- [ ] Create a beginner course on “Zero Trust network security”.
- [ ] Open one lesson, generate detailed content, answer a quiz question, then refresh the course URL.
- [ ] Confirm the generated lesson remains available after refresh and a second request uses the cached content.
- [ ] Confirm Gemini and MongoDB credentials are configured only in the server's environment.

## Portfolio handoff

- [ ] Repository README and architecture match the implemented code.
- [ ] The [demo walkthrough](demo-script.md) is recorded in 3–5 minutes.
- [ ] No performance or reliability metric is claimed unless it has been measured.
- [ ] A resume bullet describes only features that passed the checks above. Do not claim a public deployment until the deployed-app checks pass.
