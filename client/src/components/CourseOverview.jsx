import { createElement } from "react";

function CourseLevel({ level }) {
  return <span className={`level-tag level-${level}`}>{level}</span>;
}

function LessonCard({ lesson, lessonNumber }) {
  return (
    <article className="lesson-card">
      <div className="lesson-number" aria-label={`Lesson ${lessonNumber}`}>
        {String(lessonNumber).padStart(2, "0")}
      </div>
      <div className="lesson-content">
        <h4>{lesson.title}</h4>
        <div className="lesson-columns">
          <section aria-label="Lesson objectives">
            <h5>YOU’LL LEARN</h5>
            <ul>
              {lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
          </section>
          <section aria-label="Key topics">
            <h5>KEY TOPICS</h5>
            <ul>
              {lesson.keyTopics.map((topic) => <li key={topic}>{topic}</li>)}
            </ul>
          </section>
        </div>
        <section className="resource-list" aria-label="Suggested resources">
          <h5>SUGGESTED RESOURCES</h5>
          <ul>
            {lesson.resources.map((resource) => <li key={resource}>{resource}</li>)}
          </ul>
        </section>
      </div>
    </article>
  );
}

export default function CourseOverview({ course, onCreateAnother }) {
  const lessonCount = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0,
  );

  return (
    <div className="course-page">
      <div className="course-toolbar">
        <div className="breadcrumb"><span>YOUR COURSE</span><span aria-hidden="true">/</span><span>OVERVIEW</span></div>
        <button className="text-button" type="button" onClick={onCreateAnother}>
          <span aria-hidden="true">＋</span> Create another
        </button>
      </div>

      <section className="course-hero" aria-labelledby="course-title">
        <div className="course-hero-copy">
          <div className="course-tags">
            {createElement(CourseLevel, { level: course.level })}
            <span className="topic-tag">{course.topic}</span>
          </div>
          <h1 id="course-title">{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-stats" aria-label="Course details">
            <span><strong>{course.modules.length}</strong> modules</span>
            <span><strong>{lessonCount}</strong> lessons</span>
            <span>Saved {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(course.createdAt))}</span>
          </div>
        </div>
        <div className="course-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-core"><span>TL</span></div>
          <div className="art-spark spark-one">✳</div>
          <div className="art-spark spark-two">✦</div>
        </div>
      </section>

      <section className="objectives-panel" aria-labelledby="objectives-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">YOUR LEARNING GOALS</span>
            <h2 id="objectives-title">By the end, you’ll be able to</h2>
          </div>
          <span className="goal-count">{course.learningObjectives.length} goals</span>
        </div>
        <ul className="objective-grid">
          {course.learningObjectives.map((objective, index) => (
            <li key={objective}>
              <span className="objective-check" aria-hidden="true">✓</span>
              <span>{objective}</span>
              <span className="objective-index" aria-hidden="true">0{index + 1}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="syllabus-section" aria-labelledby="syllabus-title">
        <div className="section-heading syllabus-heading">
          <div>
            <span className="section-kicker">THE COURSE</span>
            <h2 id="syllabus-title">Your learning path</h2>
          </div>
          <span className="syllabus-caption">Work through each module at your own pace</span>
        </div>
        <div className="module-list">
          {course.modules.map((module, moduleIndex) => (
            <details className="module-card" key={`${module.title}-${moduleIndex}`} open={moduleIndex === 0}>
              <summary>
                <span className="module-index">MODULE {String(moduleIndex + 1).padStart(2, "0")}</span>
                <span className="module-summary-copy">
                  <strong>{module.title}</strong>
                  <span>{module.summary}</span>
                </span>
                <span className="module-count">{module.lessons.length} lessons</span>
                <span className="module-chevron" aria-hidden="true">⌄</span>
              </summary>
              <div className="module-lessons">
                {module.lessons.map((lesson, lessonIndex) => createElement(LessonCard, {
                  key: `${lesson.title}-${lessonIndex}`,
                  lesson,
                  lessonNumber: lessonIndex + 1,
                }))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="course-end-card">
        <div className="end-mark" aria-hidden="true">✦</div>
        <p>Ready to learn something else?</p>
        <button className="text-button" type="button" onClick={onCreateAnother}>Start a new course <span aria-hidden="true">→</span></button>
      </div>
    </div>
  );
}
