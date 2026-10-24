import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 5000;
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.info(`Text to Learn API listening on port ${port}`);
});

