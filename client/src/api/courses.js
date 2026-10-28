import {
  CourseCreateRequestSchema,
  CourseResponseSchema,
  LessonContentGenerationResponseSchema,
} from "@text-to-learn/shared";

async function requestJson(path, options = {}) {
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "The request could not be completed.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("The API returned an invalid response.");
  }

  return payload;
}

function parseCourse(payload) {
  const result = CourseResponseSchema.safeParse(payload?.course);
  if (!result.success) {
    throw new Error("The API returned a course in an unexpected format.");
  }

  return result.data;
}

export async function checkCourseService({ signal } = {}) {
  const payload = await requestJson("/api/health/ready", { signal });
  return payload.status === "ok";
}

export async function createCourse(input, { signal } = {}) {
  const request = CourseCreateRequestSchema.parse(input);
  const payload = await requestJson("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  return parseCourse(payload);
}

export async function getCourse(courseId, { signal } = {}) {
  const payload = await requestJson(
    `/api/courses/${encodeURIComponent(courseId)}`,
    { signal },
  );

  return parseCourse(payload);
}

export async function generateLessonContent(courseId, lessonId, { signal } = {}) {
  const payload = await requestJson(
    `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/content`,
    { method: "POST", signal },
  );
  const result = LessonContentGenerationResponseSchema.safeParse(payload.lesson);

  if (!result.success) {
    throw new Error("The API returned lesson content in an unexpected format.");
  }

  return result.data;
}
