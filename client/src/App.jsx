import { createElement, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import CourseRoute from "./pages/CourseRoute.jsx";
import CourseLibraryPage from "./pages/CourseLibraryPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import { checkCourseService } from "./api/courses.js";

function HomeRoute() {
  const location = useLocation();
  const legacyCourseId = new URLSearchParams(location.search).get("course");

  if (legacyCourseId) {
    return createElement(Navigate, {
      replace: true,
      to: `/courses/${encodeURIComponent(legacyCourseId)}`,
    });
  }

  return createElement(HomePage);
}

function NotFoundPage() {
  return (
    <section className="route-message" aria-labelledby="not-found-title">
      <div className="page-eyebrow">PAGE NOT FOUND</div>
      <h1 id="not-found-title">That page isn’t here.</h1>
      <p>Use the course library or start a new course to continue.</p>
      {createElement(Link, {
        className: "primary-button route-action",
        to: "/",
        children: "Go to course creation",
      })}
    </section>
  );
}

function RoutedApplication() {
  const [serviceStatus, setServiceStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();

    checkCourseService({ signal: controller.signal })
      .then((ready) => setServiceStatus(ready ? "ready" : "unavailable"))
      .catch((error) => {
        if (error.name !== "AbortError") setServiceStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  async function handleCheckService() {
    setServiceStatus("checking");
    try {
      const ready = await checkCourseService();
      setServiceStatus(ready ? "ready" : "unavailable");
    } catch {
      setServiceStatus("unavailable");
    }
  }

  return createElement(AppShell, {
      serviceStatus,
      children: (
        <>
      {serviceStatus === "unavailable" ? (
        <div className="service-notice" role="status">
          <p>The course service is unavailable right now. Check again when the API and database are ready.</p>
          <button className="service-retry" type="button" onClick={handleCheckService}>Check again</button>
        </div>
      ) : null}
      {createElement(
        Routes,
        null,
        createElement(Route, { path: "/", element: createElement(HomeRoute) }),
        createElement(Route, { path: "/courses", element: createElement(CourseLibraryPage) }),
        createElement(Route, { path: "/courses/:courseId", element: createElement(CourseRoute) }),
        createElement(Route, {
          path: "/courses/:courseId/module/:moduleIndex/lesson/:lessonIndex",
          element: createElement(CourseRoute, { view: "lesson" }),
        }),
        createElement(Route, { path: "*", element: createElement(NotFoundPage) }),
      )}
        </>
      ),
    });
}

export default function App() {
  return createElement(RoutedApplication);
}
