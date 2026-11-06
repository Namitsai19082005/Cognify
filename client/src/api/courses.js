import {
  CourseCreateRequestSchema,
  CourseResponseSchema,
  LessonContentGenerationResponseSchema,
} from "@text-to-learn/shared";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function requestJson(path, options = {}, getAccessTokenSilently) {
  const headers = new Headers(options.headers);
  if (getAccessTokenSilently) {
    const accessToken = await getAccessTokenSilently();
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(apiUrl(path), { ...options, headers });
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

export async function createCourse(input, { signal, getAccessTokenSilently } = {}) {
  const request = CourseCreateRequestSchema.parse(input);
  const payload = await requestJson(
    "/api/courses",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    },
    getAccessTokenSilently,
  );

  return parseCourse(payload);
}

export async function getCourse(courseId, { signal, getAccessTokenSilently } = {}) {
  const payload = await requestJson(
    `/api/courses/${encodeURIComponent(courseId)}`,
    { signal },
    getAccessTokenSilently,
  );

  return parseCourse(payload);
}

export async function generateLessonContent(
  courseId,
  lessonId,
  { signal, getAccessTokenSilently } = {},
) {
  const payload = await requestJson(
    `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/content`,
    { method: "POST", signal },
    getAccessTokenSilently,
  );
  const result = LessonContentGenerationResponseSchema.safeParse(payload.lesson);

  if (!result.success) {
    throw new Error("The API returned lesson content in an unexpected format.");
  }

  return result.data;
}
