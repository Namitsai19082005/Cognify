import { createElement, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
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

function SignInPage({ onSignIn }) {
  return (
    <section className="sign-in-page" aria-labelledby="sign-in-title">
      <div className="page-eyebrow">YOUR LEARNING SPACE</div>
      <h1 id="sign-in-title">Sign in to build your next course.</h1>
      <p>Use your account to generate courses and continue learning across sessions.</p>
      <button className="primary-button sign-in-button" type="button" onClick={onSignIn}>
        Continue with Auth0 <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}

function RoutedApplication() {
  const [serviceStatus, setServiceStatus] = useState("checking");
  const {
    isLoading: isAuthLoading,
    isAuthenticated,
    user,
    loginWithRedirect,
    logout,
  } = useAuth0();
  const location = useLocation();

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

  function handleSignIn() {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return loginWithRedirect({ appState: { returnTo } });
  }

  function handleSignOut() {
    return logout({ logoutParams: { returnTo: window.location.origin } });
  }

  let routeContent;
  if (isAuthLoading) {
    routeContent = (
      <section className="loading-panel" role="status" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <p>Checking your sign-in…</p>
      </section>
    );
  } else if (!isAuthenticated) {
    routeContent = createElement(SignInPage, { onSignIn: handleSignIn });
  } else {
    routeContent = createElement(
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
    );
  }

  return createElement(AppShell, {
    serviceStatus,
    accountName: isAuthenticated ? user?.name || user?.email || "Signed in" : "",
    onSignIn: handleSignIn,
    onSignOut: handleSignOut,
    children: (
      <>
      {serviceStatus === "unavailable" ? (
        <div className="service-notice" role="status">
          <p>The course service is unavailable right now. Check again when the API and database are ready.</p>
          <button className="service-retry" type="button" onClick={handleCheckService}>Check again</button>
        </div>
      ) : null}
      {routeContent}
      </>
    ),
  });
}

export default function App() {
  return createElement(RoutedApplication);
}
