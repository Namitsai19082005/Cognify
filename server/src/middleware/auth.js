import { auth } from "express-oauth2-jwt-bearer";

export function createAuthMiddleware({
  issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL,
  audience = process.env.AUTH0_AUDIENCE,
} = {}) {
  const normalizedIssuer = typeof issuerBaseURL === "string" ? issuerBaseURL.trim() : "";
  const normalizedAudience = typeof audience === "string" ? audience.trim() : "";

  if (!normalizedIssuer || !normalizedAudience) {
    throw new Error("AUTH0_ISSUER_BASE_URL and AUTH0_AUDIENCE are required to start the API.");
  }

  let issuer;
  try {
    issuer = new URL(normalizedIssuer);
  } catch {
    throw new Error("AUTH0_ISSUER_BASE_URL must be a valid HTTPS origin.");
  }

  if (
    issuer.protocol !== "https:"
    || issuer.pathname !== "/"
    || issuer.search
    || issuer.hash
  ) {
    throw new Error("AUTH0_ISSUER_BASE_URL must be an HTTPS origin without a path.");
  }

  return auth({
    issuerBaseURL: issuer.origin,
    audience: normalizedAudience,
    tokenSigningAlg: "RS256",
  });
}
