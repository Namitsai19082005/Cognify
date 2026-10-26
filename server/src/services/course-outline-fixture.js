const MODULES = [
  {
    title: "Foundations",
    summary: "Build the vocabulary and basic mental models needed to start.",
    lessons: [
      "Define the core ideas",
      "Connect the key concepts",
      "Check your starting understanding",
    ],
  },
  {
    title: "Core Concepts",
    summary: "Work through the main concepts and how they fit together.",
    lessons: [
      "Explore the central methods",
      "Compare common approaches",
      "Trace a worked example",
    ],
  },
  {
    title: "Practice and Review",
    summary: "Apply the ideas, review results, and plan the next steps.",
    lessons: [
      "Apply the ideas to a scenario",
      "Review common mistakes",
      "Plan a small independent exercise",
    ],
  },
];

function createLesson(topic, title) {
  return {
    title: `${topic}: ${title}`,
    objectives: [
      `Explain ${title.toLowerCase()} in the context of ${topic}.`,
      `Identify one practical example related to ${topic}.`,
    ],
    keyTopics: [title, `Practical applications of ${topic}`],
    resources: [
      `Course notes: ${title}`,
      `Practice activity: apply ${topic} to a small example`,
    ],
  };
}

export function createCourseOutlineFixture({ topic, level }) {
  const shortTopic = topic.slice(0, 68).trim();

  return {
    title: `${shortTopic} Learning Path`,
    topic,
    level,
    description: `A ${level}-level course outline for learning ${topic}, moving from foundations to guided practice.`,
    learningObjectives: [
      `Describe the foundational ideas behind ${shortTopic}.`,
      `Compare important methods used with ${shortTopic}.`,
      `Apply the concepts of ${shortTopic} to a practical scenario.`,
    ],
    modules: MODULES.map(({ title, summary, lessons }) => ({
      title,
      summary,
      lessons: lessons.map((lessonTitle) => createLesson(shortTopic, lessonTitle)),
    })),
  };
}
