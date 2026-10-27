import { createElement, useEffect, useRef, useState } from "react";
import CourseForm from "./components/CourseForm.jsx";
import CourseOverview from "./components/CourseOverview.jsx";
import {
  checkCourseService,
  createCourse,
  getCourse,
} from "./api/courses.js";

function updateCourseAddress(courseId) {
  const url = new URL(window.location.href);
  if (courseId) {
    url.searchParams.set("course", courseId);
  } else {
    url.searchParams.delete("course");
  }

  window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function App() {
  const [serviceStatus, setServiceStatus] = useState("checking");
  const [course, setCourse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [error, setError] = useState("");
  const courseRequestRef = useRef(null);

  useEffect(() => {
    const healthController = new AbortController();

    checkCourseService({ signal: healthController.signal })
      .then((ready) => setServiceStatus(ready ? "ready" : "unavailable"))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setServiceStatus("unavailable");
      });

    function loadCourseFromLocation() {
      courseRequestRef.current?.abort();
      const courseId = new URLSearchParams(window.location.search).get("course");

      if (!courseId) {
        setCourse(null);
        setIsLoadingCourse(false);
        setError("");
        return;
      }

      const controller = new AbortController();
      courseRequestRef.current = controller;
      setCourse(null);
      setIsLoadingCourse(true);
      setError("");

      getCourse(courseId, { signal: controller.signal })
        .then((savedCourse) => setCourse(savedCourse))
        .catch((requestError) => {
          if (!controller.signal.aborted) {
            setError(requestError.message);
            setCourse(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingCourse(false);
        });
    }

    loadCourseFromLocation();
    window.addEventListener("popstate", loadCourseFromLocation);

    return () => {
      healthController.abort();
      courseRequestRef.current?.abort();
      window.removeEventListener("popstate", loadCourseFromLocation);
    };
  }, []);

  async function handleGenerateCourse(input) {
    setIsGenerating(true);
    setError("");

    try {
      const generatedCourse = await createCourse(input);
      setCourse(generatedCourse);
      updateCourseAddress(generatedCourse.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCheckService() {
    setServiceStatus("checking");
    try {
      const ready = await checkCourseService();
      setServiceStatus(ready ? "ready" : "unavailable");
    } catch {
      setServiceStatus("unavailable");
    }
  }

  function handleCreateAnother() {
    courseRequestRef.current?.abort();
    updateCourseAddress(null);
    setCourse(null);
    setError("");
  }

  const serviceLabel = {
    checking: "Checking course service",
    ready: "Course service ready",
    unavailable: "Course service unavailable",
  }[serviceStatus];

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Text to Learn home">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>Text to Learn</span>
        </a>
        <div className="header-tools">
          <div className="service-status" role="status" aria-live="polite">
            <span
              className={`status-dot status-${serviceStatus}`}
              aria-hidden="true"
            />
            <span>{serviceLabel}</span>
          </div>
          <span className="header-label">AI course studio</span>
        </div>
      </header>

      <main className="main-content">
        {isLoadingCourse ? (
          <section className="loading-panel" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading your saved course…</p>
          </section>
        ) : course ? (
          createElement(CourseOverview, { course, onCreateAnother: handleCreateAnother })
        ) : (
          <section className="hero-layout" aria-labelledby="page-title">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true" />
                A clearer way to learn
              </div>
              <h1 id="page-title">Turn a topic into a learning path.</h1>
              <p className="intro-copy">
                Tell us what you want to understand. Get a structured course
                outline with modules, lesson goals, key topics, and resources.
              </p>

              <ul className="feature-list" aria-label="Course features">
                <li><span aria-hidden="true">01</span> A guided 3-module syllabus</li>
                <li><span aria-hidden="true">02</span> Clear goals for every lesson</li>
                <li><span aria-hidden="true">03</span> Saved courses you can revisit</li>
              </ul>
            </div>

            {createElement(CourseForm, {
              error,
              isGenerating,
              onSubmit: handleGenerateCourse,
            })}
          </section>
        )}

        {serviceStatus === "unavailable" && !isLoadingCourse ? (
          <div className="service-notice" role="status">
            <p>The course service is unavailable right now. Check again when the API and database are ready.</p>
            <button className="service-retry" type="button" onClick={handleCheckService}>Check again</button>
          </div>
        ) : null}
      </main>

      <footer className="page-footer">
        <span>Built for focused, self-paced learning.</span>
        <span>Text to Learn · 0.1.0</span>
      </footer>
    </div>
  );
}

