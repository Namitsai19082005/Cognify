import { randomUUID } from "node:crypto";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 10;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{1,80}$/;

export class ApiError extends Error {
  constructor(status, message, code = "request_failed") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function readPositiveInteger(value, fallback, variableName) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${variableName} must be a positive integer.`);
  }
  return parsed;
}

function readTrustProxyHops(value) {
  if (value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 10) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 10.");
  }
  return parsed;
}

function readAllowedOrigins(value) {
  const entries = (value || DEFAULT_CLIENT_ORIGIN)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return new Set(entries.map((entry) => {
    let parsed;
    try {
      parsed = new URL(entry);
    } catch {
      throw new Error("CLIENT_ORIGINS must contain valid HTTP or HTTPS origins.");
    }

    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== entry) {
      throw new Error("CLIENT_ORIGINS entries must be exact origins without paths or trailing slashes.");
    }

    return entry;
  }));
}

export function applySecurityMiddleware(app, options = {}) {
  const clientOrigins = readAllowedOrigins(
    options.clientOrigins
      ?? process.env.CLIENT_ORIGINS
      ?? process.env.CLIENT_ORIGIN,
  );
  const rateLimitWindowMs = readPositiveInteger(
    options.rateLimitWindowMs ?? process.env.GENERATION_RATE_LIMIT_WINDOW_MS,
    DEFAULT_RATE_LIMIT_WINDOW_MS,
    "GENERATION_RATE_LIMIT_WINDOW_MS",
  );
  const rateLimitMax = readPositiveInteger(
    options.rateLimitMax ?? process.env.GENERATION_RATE_LIMIT_MAX,
    DEFAULT_RATE_LIMIT_MAX,
    "GENERATION_RATE_LIMIT_MAX",
  );
  const trustProxyHops = options.trustProxyHops
    ?? readTrustProxyHops(process.env.TRUST_PROXY_HOPS);

  app.set("trust proxy", trustProxyHops);
  app.use(helmet());
  app.use((request, response, next) => {
    const suppliedRequestId = request.get("X-Request-Id");
    request.requestId = suppliedRequestId && REQUEST_ID_PATTERN.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
    response.setHeader("X-Request-Id", request.requestId);

    const startedAt = performance.now();
    response.once("finish", () => {
      console.info(JSON.stringify({
        level: "info",
        event: "http.request",
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      }));
    });

    next();
  });
  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, false);
      if (clientOrigins.has(origin)) return callback(null, true);

      const error = new Error("Request origin is not allowed.");
      error.code = "cors_origin_denied";
      return callback(error);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "RateLimit", "RateLimit-Policy", "Retry-After"],
    maxAge: 600,
  }));

  return rateLimit({
    windowMs: rateLimitWindowMs,
    limit: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler(request, response) {
      response.status(429).json({
        error: "Too many generation requests. Try again later.",
        requestId: request.requestId,
      });
    },
  });
}
