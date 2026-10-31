import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import mongoose from "mongoose";
import test from "node:test";
import { createApp } from "../src/app.js";
import { disconnectFromDatabase } from "../src/database.js";
import { Course } from "../src/models/course.js";
import { makeCourseOutline, makeLessonContent } from "../fixtures/course-fixtures.js";

const mongoUri = process.env.MONGODB_TEST_URI;

test("persists generated course and lesson content with MongoDB", {
  skip: !mongoUri && "Set MONGODB_TEST_URI to run the MongoDB integration check.",
}, async () => {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  const topic = `ci-security-test:${randomUUID()}`;
  const app = createApp({
    generateOutline: async (request) => makeCourseOutline(request.topic, request.level),
    generateLesson: async () => makeLessonContent(),
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let courseId;

  try {
    const createResponse = await fetch(`${baseUrl}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, level: "beginner" }),
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    courseId = created.course.id;

    const lesson = created.course.modules[0].lessons[0];
    const lessonPath = `/api/courses/${courseId}/lessons/${lesson.id}/content`;
    const lessonResponse = await fetch(`${baseUrl}${lessonPath}`, { method: "POST" });
    const generated = await lessonResponse.json();
    assert.equal(lessonResponse.status, 201);
    assert.equal(generated.lesson.cached, false);

    const reloadedResponse = await fetch(`${baseUrl}/api/courses/${courseId}`);
    const reloaded = await reloadedResponse.json();
    assert.equal(reloadedResponse.status, 200);
    assert.equal(reloaded.course.modules[0].lessons[0].content.length, 9);

    const cachedResponse = await fetch(`${baseUrl}${lessonPath}`, { method: "POST" });
    const cached = await cachedResponse.json();
    assert.equal(cachedResponse.status, 200);
    assert.equal(cached.lesson.cached, true);

    const storedCourse = await Course.findById(courseId);
    assert.ok(storedCourse);
    assert.equal(storedCourse.modules[0].lessons[0].content.length, 9);
  } finally {
    if (courseId) await Course.deleteOne({ _id: courseId });
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await disconnectFromDatabase();
  }
});
