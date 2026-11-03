import { createElement } from "react";
import { Link, NavLink } from "react-router-dom";

const serviceLabels = {
  checking: "Checking course service",
  ready: "Course service ready",
  unavailable: "Course service unavailable",
};

export default function AppShell({ serviceStatus, children }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        {createElement(
          Link,
          { className: "brand", to: "/", "aria-label": "Text to Learn home" },
          <span className="brand-mark" aria-hidden="true">T</span>,
          <span>Text to Learn</span>,
        )}
        <div className="header-tools">
          <div className="service-status" role="status" aria-live="polite">
            <span className={`status-dot status-${serviceStatus}`} aria-hidden="true" />
            <span>{serviceLabels[serviceStatus]}</span>
          </div>
          <span className="header-label">AI course studio</span>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="app-sidebar" aria-label="Workspace navigation">
          <span className="sidebar-label">WORKSPACE</span>
          <nav className="app-nav">
            {createElement(
              NavLink,
              { className: ({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`, to: "/", end: true },
              <span className="nav-icon" aria-hidden="true">＋</span>,
              <span>Create a course</span>,
            )}
            {createElement(
              NavLink,
              { className: ({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`, to: "/courses" },
              <span className="nav-icon nav-icon-library" aria-hidden="true">▤</span>,
              <span>Course library</span>,
            )}
          </nav>
          <div className="sidebar-note">
            <span className="sidebar-note-mark" aria-hidden="true">✦</span>
            <p>Build a learning path, then explore each lesson at your own pace.</p>
          </div>
        </aside>

        <main className="main-content">{children}</main>
      </div>

      <footer className="page-footer">
        <span>Built for focused, self-paced learning.</span>
        <span>Text to Learn · 0.1.0</span>
      </footer>
    </div>
  );
}
