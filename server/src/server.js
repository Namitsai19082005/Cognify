import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "./database.js";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const port = Number(process.env.PORT) || 5000;

function log(level, event, details = {}) {
  const message = JSON.stringify({ level, event, ...details });
  (level === "error" ? console.error : console.info)(message);
}

async function startServer() {
  try {
    const connected = await connectToDatabase();
    if (connected) log("info", "database.connected");
    else log("warn", "database.not_configured");
  } catch (error) {
    log("error", "database.connection_failed", { errorName: error.name });
  }

  const server = createApp().listen(port, "0.0.0.0", () => {
    log("info", "server.listening", { port });
  });

  const stop = () => {
    server.close(async () => {
      await disconnectFromDatabase();
      log("info", "server.stopped");
      process.exitCode = 0;
    });
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

startServer();

