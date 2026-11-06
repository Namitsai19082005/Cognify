import React, { createElement, useCallback } from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import App from "./App.jsx";
import AuthConfigurationRequired from "./components/AuthConfigurationRequired.jsx";
import "./styles.css";

const auth0Domain = (import.meta.env.VITE_AUTH0_DOMAIN ?? "")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");
const auth0ClientId = (import.meta.env.VITE_AUTH0_CLIENT_ID ?? "").trim();
const auth0Audience = (import.meta.env.VITE_AUTH0_AUDIENCE ?? "").trim();
const hasAuth0Config = Boolean(auth0Domain && auth0ClientId && auth0Audience);

function Auth0Application({ children }) {
  const navigate = useNavigate();
  const handleRedirect = useCallback((appState) => {
    navigate(appState?.returnTo || "/", { replace: true });
  }, [navigate]);

  return createElement(Auth0Provider, {
    domain: auth0Domain,
    clientId: auth0ClientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: auth0Audience,
      scope: "openid profile email",
    },
    onRedirectCallback: handleRedirect,
    children,
  });
}

function ClientApplication() {
  if (!hasAuth0Config) return createElement(AuthConfigurationRequired);
  return createElement(Auth0Application, null, createElement(App));
}

createRoot(document.getElementById("root")).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(BrowserRouter, null, React.createElement(ClientApplication)),
  ),
);

