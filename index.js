import express from "express";
import { initCache } from "./utils.js";
import sourcesRouter from "./routes/api/sources.js";

initCache();

const app = express();
const port = 5500;

app.use("/api/sources", sourcesRouter);

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);
