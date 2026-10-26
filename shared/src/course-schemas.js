import { z } from "zod";

export const CourseLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

const CourseTextSchema = z.string().trim().min(3).max(160);
const LearningObjectiveSchema = z.string().trim().min(3).max(180);
const LessonTitleSchema = z.string().trim().min(3).max(120);

export const CourseCreateRequestSchema = z
  .object({
    topic: CourseTextSchema,
    level: CourseLevelSchema.default("beginner"),
  })
  .strict();

const LessonOutlineSchema = z
  .object({
    title: LessonTitleSchema,
    objectives: z.array(LearningObjectiveSchema).min(2).max(4),
    keyTopics: z.array(LearningObjectiveSchema).min(2).max(5),
    resources: z.array(z.string().trim().min(3).max(240)).min(1).max(3),
  })
  .strict();

const ModuleOutlineSchema = z
  .object({
    title: LessonTitleSchema,
    summary: z.string().trim().min(10).max(320),
    lessons: z.array(LessonOutlineSchema).length(3),
  })
  .strict();

export const CourseOutlineSchema = z
  .object({
    title: LessonTitleSchema,
    topic: CourseTextSchema,
    level: CourseLevelSchema,
    description: z.string().trim().min(20).max(500),
    learningObjectives: z.array(LearningObjectiveSchema).min(3).max(5),
    modules: z.array(ModuleOutlineSchema).length(3),
  })
  .strict();

export const CourseResponseSchema = CourseOutlineSchema.extend({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).strict();
