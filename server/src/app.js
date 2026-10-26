import express from "express";
import {
  CourseCreateRequestSchema,
  CourseOutlineSchema,
  CourseResponseSchema,
} from "@text-to-learn/shared";
import { isDatabaseConnected } from "./database.js";
import { Course, serializeCourse } from "./models/course.js";
import {
  CourseGenerationError,
  generateCourseOutline,
} from "./services/gemini-course-generator.js";

const COURSE_ID_PATTERN = /^[a-f\d]{24}$/i;

function validationDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export function createApp({
  courseModel = Course,
  generateOutline = generateCourseOutline,
} = {}) {
  const app = express();
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health/live", (_request, response) => {
    response.json({
      status: "ok",
      service: "text-to-learn-api",
    });
  });

  app.get("/api/health/ready", (_request, response) => {
    const ready = isDatabaseConnected();

    response.status(ready ? 200 : 503).json({
      status: ready ? "ok" : "unavailable",
      database: ready ? "connected" : "disconnected",
    });
  });

  app.post("/api/courses", async (request, response) => {
    const input = CourseCreateRequestSchema.safeParse(request.body);
    if (!input.success) {
      return response.status(400).json({
        error: "Invalid course request.",
        details: validationDetails(input.error),
      });
    }

    if (!isDatabaseConnected()) {
      return response.status(503).json({
        error: "Course storage is unavailable. Configure MongoDB and try again.",
      });
    }

    try {
      const outline = CourseOutlineSchema.parse(await generateOutline(input.data));
      const savedCourse = await courseModel.create(outline);
      const course = CourseResponseSchema.parse(serializeCourse(savedCourse));

      return response.status(201).json({ course });
    } catch (error) {
      if (error instanceof CourseGenerationError) {
        if (error.code === "not_configured") {
          return response.status(503).json({
            error: "Course generation is not configured on this server.",
          });
        }

        if (error.code === "provider_failure") {
          return response.status(502).json({
            error: "Course generation is temporarily unavailable. Try again.",
          });
        }

        if (error.code === "invalid_output") {
          return response.status(502).json({
            error: "A valid course could not be generated. Try a different topic.",
          });
        }
      }

      return response.status(500).json({
        error: "The course could not be saved right now.",
      });
    }
  });

  app.get("/api/courses/:courseId", async (request, response) => {
    const { courseId } = request.params;
    if (!COURSE_ID_PATTERN.test(courseId)) {
      return response.status(400).json({ error: "Invalid course ID." });
    }

    if (!isDatabaseConnected()) {
      return response.status(503).json({
        error: "Course storage is unavailable. Configure MongoDB and try again.",
      });
    }

    try {
      const savedCourse = await courseModel.findById(courseId);
      if (!savedCourse) {
        return response.status(404).json({ error: "Course not found." });
      }

      const course = CourseResponseSchema.parse(serializeCourse(savedCourse));
      return response.json({ course });
    } catch {
      return response.status(500).json({
        error: "The course could not be loaded right now.",
      });
    }
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found." });
  });

  app.use((error, _request, response, _next) => {
    if (error.type === "entity.parse.failed") {
      return response.status(400).json({ error: "Request body must be valid JSON." });
    }
    if (error.type === "entity.too.large") {
      return response.status(413).json({ error: "Request body is too large." });
    }

    return response.status(500).json({ error: "Internal server error." });
  });

  return app;
}

