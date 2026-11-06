export default function AuthConfigurationRequired() {
  return (
    <main className="auth-config-page">
      <section className="auth-config-card" aria-labelledby="auth-config-title">
        <span className="page-eyebrow">AUTHENTICATION SETUP</span>
        <h1 id="auth-config-title">Connect your Auth0 application</h1>
        <p>
          Add the Auth0 SPA settings to the client environment, then restart the development server.
        </p>
        <pre><code>VITE_AUTH0_DOMAIN=your-tenant.auth0.com{"\n"}VITE_AUTH0_CLIENT_ID=your-spa-client-id{"\n"}VITE_AUTH0_AUDIENCE=your-api-audience</code></pre>
        <p className="auth-config-note">
          The client ID and API audience are public identifiers. Never put an Auth0 client secret in the browser app.
        </p>
      </section>
    </main>
  );
}
