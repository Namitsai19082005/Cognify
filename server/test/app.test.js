import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../src/app.js";
import { CourseGenerationError } from "../src/services/gemini-course-generator.js";
import {
  createMemoryCourseModel,
  makeCourseOutline,
  makeLessonContent,
} from "../fixtures/course-fixtures.js";

const CLIENT_ORIGIN = "https://learning.example";

function createTestApp(options = {}) {
  return createApp({
    courseModel: options.courseModel ?? createMemoryCourseModel(),
    databaseReady: options.databaseReady ?? (() => true),
    generateOutline: options.generateOutline ?? ((request) => (
      makeCourseOutline(request.topic, request.level)
    )),
    generateLesson: options.generateLesson ?? (() => makeLessonContent()),
    securityOptions: {
      clientOrigins: CLIENT_ORIGIN,
      rateLimitMax: options.rateLimitMax ?? 10,
      rateLimitWindowMs: 60_000,
      trustProxyHops: 0,
    },
  });
}

async function withServer(app, run) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("adds security headers, permits the configured origin, and returns a request ID", async () => {
  await withServer(createTestApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health/live`, {
      headers: {
        Origin: CLIENT_ORIGIN,
        "X-Request-Id": "demo-request-42",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), CLIENT_ORIGIN);
    assert.equal(response.headers.get("x-request-id"), "demo-request-42");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.ok(response.headers.get("content-security-policy"));
  });
});

test("rejects an untrusted browser origin with a safe error", async () => {
  await withServer(createTestApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health/live`, {
      headers: { Origin: "https://untrusted.example" },
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error, "Request origin is not allowed.");
    assert.match(payload.requestId, /^[a-f\d-]{36}$/i);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("returns request IDs and safe errors for invalid JSON, oversized input, and provider failures", async () => {
  const app = createTestApp({
    generateOutline: async () => {
      throw new CourseGenerationError("provider_failure", "sensitive provider response");
    },
  });

  await withServer(app, async (baseUrl) => {
    const invalidJson = await fetch(`${baseUrl}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    const invalidPayload = await invalidJson.json();
    assert.equal(invalidJson.status, 400);
    assert.equal(invalidPayload.error, "Request body must be valid JSON.");
    assert.equal(invalidPayload.requestId, invalidJson.headers.get("x-request-id"));

    const oversizedBody = JSON.stringify({ topic: "x".repeat(17 * 1024) });
    const oversized = await fetch(`${baseUrl}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversizedBody,
    });
    const oversizedPayload = await oversized.json();
    assert.equal(oversized.status, 413);
    assert.equal(oversizedPayload.error, "Request body is too large.");

    const providerFailure = await fetch(`${baseUrl}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Zero Trust security", level: "beginner" }),
    });
    const providerPayload = await providerFailure.json();
    assert.equal(providerFailure.status, 502);
    assert.equal(providerPayload.error, "Course generation is temporarily unavailable. Try again.");
    assert.equal(JSON.stringify(providerPayload).includes("sensitive provider response"), false);
  });
});

test("rejects invalid model output before saving a course", async () => {
  const courseModel = createMemoryCourseModel();
  let createCount = 0;
  const app = createTestApp({
    courseModel: {
      async create(...args) {
        createCount += 1;
        return courseModel.create(...args);
      },
      findById: (...args) => courseModel.findById(...args),
    },
    generateOutline: async () => ({ title: "Invalid model response" }),
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Zero Trust security", level: "beginner" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 502);
    assert.equal(payload.error, "A valid course could not be generated. Try a different topic.");
    assert.equal(createCount, 0);
  });
});

test("limits course and lesson generation requests by client IP", async () => {
  await withServer(createTestApp({ rateLimitMax: 2 }), async (baseUrl) => {
    const statuses = [];
    for (let index = 0; index < 3; index += 1) {
      const response = await fetch(`${baseUrl}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "x" }),
      });
      statuses.push(response.status);
      if (response.status === 429) {
        const payload = await response.json();
        assert.equal(payload.error, "Too many generation requests. Try again later.");
        assert.equal(payload.requestId, response.headers.get("x-request-id"));
      }
    }

    assert.deepEqual(statuses, [400, 400, 429]);
  });
});

test("generates, persists, reloads, and reuses lesson content", async () => {
  let lessonGenerationCount = 0;
  const app = createTestApp({
    generateLesson: async () => {
      lessonGenerationCount += 1;
      return makeLessonContent();
    },
  });

  await withServer(app, async (baseUrl) => {
    const createdResponse = await fetch(`${baseUrl}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Zero Trust network security", level: "beginner" }),
    });
    const createdPayload = await createdResponse.json();
    assert.equal(createdResponse.status, 201);

    const course = createdPayload.course;
    const lesson = course.modules[0].lessons[0];
    const lessonUrl = `${baseUrl}/api/courses/${course.id}/lessons/${lesson.id}/content`;
    const firstLessonResponse = await fetch(lessonUrl, { method: "POST" });
    const firstLessonPayload = await firstLessonResponse.json();
    assert.equal(firstLessonResponse.status, 201);
    assert.equal(firstLessonPayload.lesson.cached, false);

    const savedCourseResponse = await fetch(`${baseUrl}/api/courses/${course.id}`);
    const savedCoursePayload = await savedCourseResponse.json();
    assert.equal(savedCoursePayload.course.modules[0].lessons[0].content.length, 9);

    const cachedLessonResponse = await fetch(lessonUrl, { method: "POST" });
    const cachedLessonPayload = await cachedLessonResponse.json();
    assert.equal(cachedLessonPayload.lesson.cached, true);
    assert.equal(lessonGenerationCount, 1);
  });
});

test("reports unavailable storage and rejects malformed resource IDs", async () => {
  const app = createTestApp({ databaseReady: () => false });

  await withServer(app, async (baseUrl) => {
    const notReady = await fetch(`${baseUrl}/api/health/ready`);
    assert.equal(notReady.status, 503);
    assert.equal((await notReady.json()).database, "disconnected");

    const invalidId = await fetch(`${baseUrl}/api/courses/invalid`);
    assert.equal(invalidId.status, 400);
    assert.equal((await invalidId.json()).error, "Invalid course ID.");
  });
});
