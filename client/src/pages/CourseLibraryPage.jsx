import { createElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { forgetCourse, readRecentCourses } from "../data/recent-courses.js";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved course";
  return `Saved ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)}`;
}

export default function CourseLibraryPage() {
  const [courses, setCourses] = useState(() => readRecentCourses());

  useEffect(() => {
    function refreshCourses() {
      setCourses(readRecentCourses());
    }

    window.addEventListener("storage", refreshCourses);
    return () => window.removeEventListener("storage", refreshCourses);
  }, []);

  function handleRemove(courseId) {
    setCourses(forgetCourse(courseId));
  }

  return (
    <section className="library-page" aria-labelledby="library-title">
      <div className="library-heading-row">
        <div>
          <div className="page-eyebrow">YOUR LEARNING SPACE</div>
          <h1 id="library-title">Course library</h1>
          <p className="library-intro">
            Courses saved in this browser. Sign-in and cross-device sync are planned next.
          </p>
        </div>
        {createElement(Link, {
          className: "primary-button library-create-link",
          to: "/",
          children: ["Create a course ", <span key="arrow" aria-hidden="true">→</span>],
        })}
      </div>

      {courses.length === 0 ? (
        <div className="library-empty-state">
          <span className="library-empty-mark" aria-hidden="true">▤</span>
          <h2>Your library is ready for a first course</h2>
          <p>Generate a course and it will appear here on this device.</p>
          {createElement(Link, { className: "text-button", to: "/", children: "Create your first course →" })}
        </div>
      ) : (
        <ul className="course-library-list" aria-label="Saved courses on this device">
          {courses.map((course) => (
            <li className="course-library-item" key={course.id}>
              {createElement(
                Link,
                { className: "course-library-card", to: `/courses/${encodeURIComponent(course.id)}` },
                <div className="course-library-card-top">
                  <span className={`level-tag level-${course.level}`}>{course.level}</span>
                  <span className="course-library-date">{formatDate(course.createdAt)}</span>
                </div>,
                <h2>{course.title}</h2>,
                <p>{course.topic}</p>,
                <span className="course-library-open">Open course <span aria-hidden="true">↗</span></span>,
              )}
              <button
                className="course-library-remove"
                type="button"
                aria-label={`Remove ${course.title} from this browser's library`}
                onClick={() => handleRemove(course.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
