import { createElement } from "react";
import { Link } from "react-router-dom";
import LessonContentRenderer from "../components/LessonContentRenderer.jsx";

function LessonRouteLink({ to, label, direction }) {
  if (!to) {
    return (
      <span className="lesson-sequence-link is-disabled" aria-disabled="true">
        <span aria-hidden="true">{direction === "previous" ? "←" : "→"}</span>
        {label}
      </span>
    );
  }

  return createElement(
    Link,
    { className: "lesson-sequence-link", to },
    <span aria-hidden="true">{direction === "previous" ? "←" : "→"}</span>,
    label,
  );
}

export default function LessonPage({
  course,
  moduleIndex,
  lessonIndex,
  lesson,
  onGenerateLesson,
  isGenerating,
  error,
}) {
  const allLessons = course.modules.flatMap((module, currentModuleIndex) => (
    module.lessons.map((currentLesson, currentLessonIndex) => ({
      moduleIndex: currentModuleIndex,
      lessonIndex: currentLessonIndex,
      lesson: currentLesson,
    }))
  ));
  const currentPosition = allLessons.findIndex((item) => item.lesson.id === lesson.id);
  const previousLesson = allLessons[currentPosition - 1];
  const nextLesson = allLessons[currentPosition + 1];
  const lessonPath = (item) => (
    `/courses/${encodeURIComponent(course.id)}/module/${item.moduleIndex}/lesson/${item.lessonIndex}`
  );

  return (
    <article className="lesson-page">
      <div className="lesson-page-toolbar">
        {createElement(Link, {
          className: "lesson-back-link",
          to: `/courses/${encodeURIComponent(course.id)}`,
          children: "← Course overview",
        })}
        <span>MODULE {String(moduleIndex + 1).padStart(2, "0")} · LESSON {String(lessonIndex + 1).padStart(2, "0")}</span>
      </div>

      <header className="lesson-page-heading">
        <div className="page-eyebrow">{course.title}</div>
        <p className="lesson-module-label">{course.modules[moduleIndex].title}</p>
        <h1>{lesson.title}</h1>
        <p>{course.modules[moduleIndex].summary}</p>
      </header>

      <div className="lesson-detail-panels">
        <section className="lesson-detail-panel" aria-labelledby="lesson-objectives-title">
          <h2 id="lesson-objectives-title">You’ll learn</h2>
          <ul>{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        </section>
        <section className="lesson-detail-panel" aria-labelledby="lesson-topics-title">
          <h2 id="lesson-topics-title">Key topics</h2>
          <ul>{lesson.keyTopics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
        </section>
      </div>

      <section className="lesson-resource-panel" aria-labelledby="lesson-resources-title">
        <h2 id="lesson-resources-title">Suggested resources</h2>
        <ul>{lesson.resources.map((resource) => <li key={resource}>{resource}</li>)}</ul>
      </section>

      {lesson.content?.length ? (
        createElement(LessonContentRenderer, {
          content: lesson.content,
          lessonId: lesson.id,
          generatedAt: lesson.contentGeneratedAt,
        })
      ) : (
        <section className="lesson-generate-card" aria-label="Generate detailed lesson">
          <div>
            <span className="section-kicker">READY WHEN YOU ARE</span>
            <h2>Explore this lesson in more detail</h2>
            <p>Generate an explanation, examples, a video suggestion, and a knowledge check.</p>
          </div>
          <button
            className="primary-button lesson-generate-button-primary"
            type="button"
            disabled={isGenerating}
            onClick={() => onGenerateLesson(lesson.id)}
          >
            {isGenerating ? "Building lesson…" : "Generate detailed lesson"}
          </button>
          {error ? <p className="lesson-generation-error" role="alert">{error}</p> : null}
        </section>
      )}

      <nav className="lesson-sequence-nav" aria-label="Move between lessons">
        {createElement(LessonRouteLink, {
          to: previousLesson ? lessonPath(previousLesson) : null,
          label: previousLesson ? previousLesson.lesson.title : "Start of course",
          direction: "previous",
        })}
        {createElement(LessonRouteLink, {
          to: nextLesson ? lessonPath(nextLesson) : null,
          label: nextLesson ? nextLesson.lesson.title : "End of course",
          direction: "next",
        })}
      </nav>
    </article>
  );
}
