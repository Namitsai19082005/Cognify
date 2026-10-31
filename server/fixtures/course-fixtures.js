export function makeCourseOutline(topic = "Zero Trust network security", level = "beginner") {
  return {
    title: "Zero Trust Network Security",
    topic,
    level,
    description: "Learn practical principles for protecting modern networked systems.",
    learningObjectives: [
      "Describe how Zero Trust changes network access decisions.",
      "Compare identity, device, and policy signals used in access control.",
      "Apply a basic least-privilege review to a service.",
    ],
    modules: Array.from({ length: 3 }, (_, moduleIndex) => ({
      title: `Module ${moduleIndex + 1}: Security Foundations`,
      summary: "Build the foundations needed to reason about secure system design.",
      lessons: Array.from({ length: 3 }, (_, lessonIndex) => ({
        title: `Lesson ${moduleIndex + 1}.${lessonIndex + 1}: Access decisions`,
        objectives: [
          "Explain the principle in a concrete setting.",
          "Identify one way to validate an access decision.",
        ],
        keyTopics: ["identity signals", "least privilege"],
        resources: ["NIST Zero Trust Architecture overview"],
      })),
    })),
  };
}

export function makeLessonContent() {
  return [
    { type: "heading", text: "Trust is evaluated per request" },
    { type: "paragraph", text: "A Zero Trust design evaluates each access request with current identity and device signals." },
    { type: "heading", text: "Start with least privilege" },
    { type: "paragraph", text: "Grant only the access needed for the task, then review the decision as context changes." },
    { type: "video", query: "Zero Trust access policy explained" },
    ...Array.from({ length: 4 }, (_, index) => ({
      type: "mcq",
      question: `Which action supports a Zero Trust policy (${index + 1})?`,
      options: ["Evaluate each request", "Trust every internal request", "Share one admin account", "Disable device checks"],
      answerIndex: 0,
      explanation: "Evaluating each request against current policy supports least-privilege access.",
    })),
  ];
}

export function createMemoryCourseModel() {
  const documents = new Map();
  let nextId = 1;

  class MemoryCourseDocument {
    constructor(data) {
      this._id = data._id;
      this.title = data.title;
      this.topic = data.topic;
      this.level = data.level;
      this.description = data.description;
      this.learningObjectives = data.learningObjectives;
      this.createdAt = data.createdAt;
      this.updatedAt = data.updatedAt;
      this.modules = data.modules.map((courseModule) => ({
        title: courseModule.title,
        summary: courseModule.summary,
        lessons: courseModule.lessons.map((lesson) => ({
          ...lesson,
          set(values) {
            Object.assign(this, values);
          },
        })),
      }));
    }

    toObject() {
      return {
        _id: this._id,
        title: this.title,
        topic: this.topic,
        level: this.level,
        description: this.description,
        learningObjectives: this.learningObjectives,
        modules: this.modules.map((courseModule) => ({
          title: courseModule.title,
          summary: courseModule.summary,
          lessons: courseModule.lessons.map((lesson) => Object.fromEntries(
            Object.entries(lesson).filter(([key]) => key !== "set"),
          )),
        })),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    }

    async save() {
      this.updatedAt = new Date();
      documents.set(String(this._id), this);
      return this;
    }
  }

  return {
    async create(outline) {
      const id = String(nextId++).padStart(24, "0");
      let lessonId = 1;
      const data = {
        ...structuredClone(outline),
        _id: id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      data.modules = data.modules.map((courseModule) => ({
        ...courseModule,
        lessons: courseModule.lessons.map((lesson) => ({
          ...lesson,
          _id: String(lessonId++).padStart(24, "0"),
        })),
      }));

      const document = new MemoryCourseDocument(data);
      documents.set(id, document);
      return document;
    },
    async findById(id) {
      return documents.get(String(id)) ?? null;
    },
  };
}
