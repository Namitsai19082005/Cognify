import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    objectives: { type: [String], required: true },
    keyTopics: { type: [String], required: true },
    resources: { type: [String], required: true },
  },
  { timestamps: false },
);

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    summary: { type: String, required: true, trim: true, maxlength: 320 },
    lessons: { type: [lessonSchema], required: true },
  },
  { _id: false, timestamps: false },
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    topic: { type: String, required: true, trim: true, maxlength: 160 },
    level: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
    },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    learningObjectives: { type: [String], required: true },
    modules: { type: [moduleSchema], required: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export function serializeCourse(document) {
  const plain = document.toObject({ versionKey: false });
  const { _id, createdAt, updatedAt, modules, ...courseFields } = plain;

  return {
    ...courseFields,
    id: String(_id),
    modules: modules.map(({ title, summary, lessons }) => ({
      title,
      summary,
      lessons: lessons.map(({ _id: lessonId, ...lesson }) => ({
        ...lesson,
        id: String(lessonId),
      })),
    })),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}
