import express from "express";

export function createApp() {
  const app = express();

  app.get("/api/health/live", (_request, response) => {
    response.json({
      status: "ok",
      service: "text-to-learn-api",
    });
  });

  return app;
}

