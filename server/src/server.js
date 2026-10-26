import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "./database.js";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    const connected = await connectToDatabase();
    if (connected) console.info("MongoDB connection established.");
    else console.warn("MONGODB_URI is unset; course persistence is unavailable.");
  } catch (error) {
    console.error(
      `MongoDB connection failed (${error.name}); course persistence is unavailable.`,
    );
  }

  const server = createApp().listen(port, "0.0.0.0", () => {
    console.info(`Text to Learn API listening on port ${port}`);
  });

  const stop = () => {
    server.close(async () => {
      await disconnectFromDatabase();
      process.exitCode = 0;
    });
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

startServer();

