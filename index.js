import articlesRouter from "./routes/api/articles.js";
import debugBatchesRouter from "./routes/debug/batches.js";
import debugSourcesRouter from "./routes/debug/sources.js";
import express from "express";
import { initCache } from "./utils.js";
import sourcesRouter from "./routes/api/sources.js";

initCache();

const app = express();
const port = 5500;

app.set("view engine", "pug");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/api/sources", sourcesRouter);
app.use("/api/articles", articlesRouter);
app.use("/debug/sources", debugSourcesRouter);
app.use("/debug/batches", debugBatchesRouter);

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);
