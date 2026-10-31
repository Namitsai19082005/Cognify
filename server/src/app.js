import express from "express";
import {
  CourseCreateRequestSchema,
  CourseOutlineSchema,
  CourseResponseSchema,
  LessonContentGenerationResponseSchema,
  LessonContentSchema,
} from "@text-to-learn/shared";
import { isDatabaseConnected } from "./database.js";
import { Course, serializeCourse } from "./models/course.js";
import {
  CourseGenerationError,
  generateCourseOutline,
} from "./services/gemini-course-generator.js";
import {
  LessonGenerationError,
  generateLessonContent,
} from "./services/gemini-lesson-generator.js";
import { ApiError, applySecurityMiddleware } from "./middleware/security.js";

const COURSE_ID_PATTERN = /^[a-f\d]{24}$/i;
const SAFE_ERROR_CODES = new Set([
  "cors_origin_denied",
  "entity.parse.failed",
  "entity.too.large",
  "route_not_found",
  "course_save_failed",
  "course_load_failed",
  "course_generation_not_configured",
  "course_provider_failure",
  "course_invalid_output",
  "lesson_save_failed",
  "lesson_generation_not_configured",
  "lesson_provider_failure",
  "lesson_invalid_output",
  "lesson_not_found",
]);

function validationDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function courseGenerationApiError(error) {
  if (error instanceof CourseGenerationError) {
    if (error.code === "not_configured") {
      return new ApiError(
        503,
        "Course generation is not configured on this server.",
        "course_generation_not_configured",
      );
    }

    if (error.code === "provider_failure") {
      return new ApiError(
        502,
        "Course generation is temporarily unavailable. Try again.",
        "course_provider_failure",
      );
    }

    if (error.code === "invalid_output") {
      return new ApiError(
        502,
        "A valid course could not be generated. Try a different topic.",
        "course_invalid_output",
      );
    }
  }

  if (error?.name === "ZodError") {
    return new ApiError(
      502,
      "A valid course could not be generated. Try a different topic.",
      "course_invalid_output",
    );
  }

  return new ApiError(
    500,
    "The course could not be saved right now.",
    "course_save_failed",
  );
}

function lessonGenerationApiError(error) {
  if (error instanceof LessonGenerationError) {
    if (error.code === "not_configured") {
      return new ApiError(
        503,
        "Lesson generation is not configured on this server.",
        "lesson_generation_not_configured",
      );
    }

    if (error.code === "provider_failure") {
      return new ApiError(
        502,
        "Lesson generation is temporarily unavailable. Try again.",
        "lesson_provider_failure",
      );
    }

    if (error.code === "invalid_output") {
      return new ApiError(
        502,
        "Valid lesson content could not be generated. Try again.",
        "lesson_invalid_output",
      );
    }
  }

  if (error?.name === "ZodError") {
    return new ApiError(
      502,
      "A valid lesson could not be generated. Try again.",
      "lesson_invalid_output",
    );
  }

  return new ApiError(
    500,
    "The lesson could not be generated or saved right now.",
    "lesson_save_failed",
  );
}

function handleApiError(error, request, response, next) {
  if (response.headersSent) return next(error);

  let status = Number.isInteger(error?.status) ? error.status : 500;
  let message = error instanceof ApiError ? error.message : "Internal server error.";
  let code = SAFE_ERROR_CODES.has(error?.code) ? error.code : "internal_error";

  if (error?.type === "entity.parse.failed") {
    status = 400;
    message = "Request body must be valid JSON.";
    code = error.type;
  } else if (error?.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large.";
    code = error.type;
  } else if (error?.code === "cors_origin_denied") {
    status = 403;
    message = "Request origin is not allowed.";
    code = error.code;
  } else if (!(error instanceof ApiError)) {
    status = 500;
    message = "Internal server error.";
  }

  const level = status >= 500 ? "error" : "warn";
  const log = status >= 500 ? console.error : console.warn;
  log(JSON.stringify({
    level,
    event: "http.error",
    requestId: request.requestId,
    statusCode: status,
    code,
  }));

  return response.status(status).json({
    error: message,
    requestId: request.requestId,
  });
}

export function createApp({
  courseModel = Course,
  generateOutline = generateCourseOutline,
  generateLesson = generateLessonContent,
  databaseReady = isDatabaseConnected,
  securityOptions,
} = {}) {
  const app = express();
  const generationLimiter = applySecurityMiddleware(app, securityOptions);
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health/live", (_request, response) => {
    response.json({
      status: "ok",
      service: "text-to-learn-api",
    });
  });

  app.get("/api/health/ready", (_request, response) => {
    const ready = databaseReady();

    response.status(ready ? 200 : 503).json({
      status: ready ? "ok" : "unavailable",
      database: ready ? "connected" : "disconnected",
    });
  });

  app.post("/api/courses", generationLimiter, async (request, response, next) => {
    const input = CourseCreateRequestSchema.safeParse(request.body);
    if (!input.success) {
      return response.status(400).json({
        error: "Invalid course request.",
        details: validationDetails(input.error),
        requestId: request.requestId,
      });
    }

    if (!databaseReady()) {
      return response.status(503).json({
        error: "Course storage is unavailable. Configure MongoDB and try again.",
        requestId: request.requestId,
      });
    }

    try {
      const outline = CourseOutlineSchema.parse(await generateOutline(input.data));
      const savedCourse = await courseModel.create(outline);
      const course = CourseResponseSchema.parse(serializeCourse(savedCourse));

      return response.status(201).json({ course });
    } catch (error) {
      return next(courseGenerationApiError(error));
    }
  });

  app.get("/api/courses/:courseId", async (request, response, next) => {
    const { courseId } = request.params;
    if (!COURSE_ID_PATTERN.test(courseId)) {
      return response.status(400).json({
        error: "Invalid course ID.",
        requestId: request.requestId,
      });
    }

    if (!databaseReady()) {
      return response.status(503).json({
        error: "Course storage is unavailable. Configure MongoDB and try again.",
        requestId: request.requestId,
      });
    }

    try {
      const savedCourse = await courseModel.findById(courseId);
      if (!savedCourse) {
        return response.status(404).json({
          error: "Course not found.",
          requestId: request.requestId,
        });
      }

      const course = CourseResponseSchema.parse(serializeCourse(savedCourse));
      return response.json({ course });
    } catch {
      return next(new ApiError(
        500,
        "The course could not be loaded right now.",
        "course_load_failed",
      ));
    }
  });

  app.post(
    "/api/courses/:courseId/lessons/:lessonId/content",
    generationLimiter,
    async (request, response, next) => {
      const { courseId, lessonId } = request.params;
      if (!COURSE_ID_PATTERN.test(courseId) || !COURSE_ID_PATTERN.test(lessonId)) {
        return response.status(400).json({
          error: "Invalid course or lesson ID.",
          requestId: request.requestId,
        });
      }

      if (!databaseReady()) {
        return response.status(503).json({
          error: "Course storage is unavailable. Configure MongoDB and try again.",
          requestId: request.requestId,
        });
      }

      try {
        const savedCourse = await courseModel.findById(courseId);
        if (!savedCourse) {
          return response.status(404).json({
            error: "Course not found.",
            requestId: request.requestId,
          });
        }

        let selectedModule;
        let selectedLesson;
        for (const courseModule of savedCourse.modules) {
          const matchingLesson = courseModule.lessons.find(
            (lesson) => String(lesson._id) === lessonId,
          );
          if (matchingLesson) {
            selectedModule = courseModule;
            selectedLesson = matchingLesson;
            break;
          }
        }

        if (!selectedLesson) {
          return response.status(404).json({
            error: "Lesson not found in this course.",
            requestId: request.requestId,
          });
        }

        const cachedContent = LessonContentSchema.safeParse(selectedLesson.content);
        if (cachedContent.success && selectedLesson.contentGeneratedAt) {
          const cachedResponse = LessonContentGenerationResponseSchema.parse({
            lessonId,
            content: cachedContent.data,
            generatedAt: selectedLesson.contentGeneratedAt.toISOString(),
            cached: true,
          });
          return response.json({ lesson: cachedResponse });
        }

        const content = LessonContentSchema.parse(await generateLesson({
          courseTitle: savedCourse.title,
          topic: savedCourse.topic,
          level: savedCourse.level,
          moduleTitle: selectedModule.title,
          moduleSummary: selectedModule.summary,
          lessonTitle: selectedLesson.title,
          objectives: selectedLesson.objectives,
          keyTopics: selectedLesson.keyTopics,
        }));
        const generatedAt = new Date();
        selectedLesson.set({ content, contentGeneratedAt: generatedAt });
        await savedCourse.save();

        const lesson = LessonContentGenerationResponseSchema.parse({
          lessonId,
          content,
          generatedAt: generatedAt.toISOString(),
          cached: false,
        });
        return response.status(201).json({ lesson });
      } catch (error) {
        return next(lessonGenerationApiError(error));
      }
    },
  );

  app.use((_request, _response, next) => {
    next(new ApiError(404, "Route not found.", "route_not_found"));
  });
  app.use(handleApiError);

  return app;
}
