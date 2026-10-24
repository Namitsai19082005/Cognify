import { useEffect, useState } from "react";

const API_HEALTH_URL = "/api/health/live";

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch(API_HEALTH_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("API health check failed");
        return response.json();
      })
      .then(() => setApiStatus("connected"))
      .catch((error) => {
        if (error.name !== "AbortError") setApiStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Text to Learn home">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>Text to Learn</span>
        </a>
        <span className="header-label">AI course studio</span>
      </header>

      <section className="intro-card" aria-labelledby="page-title">
        <div className="eyebrow">A clearer way to learn</div>
        <h1 id="page-title">Turn a topic into a learning path.</h1>
        <p className="intro-copy">
          Start with a subject you want to understand. Text to Learn will shape
          it into a course with focused modules and lessons.
        </p>

        <div className="status-row" role="status" aria-live="polite">
          <span className={`status-dot status-${apiStatus}`} aria-hidden="true" />
          <span>
            API {apiStatus === "checking" ? "connecting" : apiStatus}
          </span>
        </div>
      </section>

      <footer className="page-footer">
        <span>Built for focused, self-paced learning.</span>
        <span>Project foundation · 0.1.0</span>
      </footer>
    </main>
  );
}

