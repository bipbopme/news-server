import { readFileSync, readdirSync, writeFileSync } from "fs";

import express from "express";
import path from "path";

const router = express.Router();
const __dirname = path.resolve();
const SOURCES_OUTPUT_PATH = path.join(__dirname, ".cache", "sources.json");

function cacheSources() {
  const dirname = "data/sources/";
  const sources = [];
  const filenames = readdirSync(dirname);

  filenames.forEach(function (filename) {
    const content = readFileSync(dirname + filename, "utf-8");
    sources.push(JSON.parse(content));
  });

  writeFileSync(SOURCES_OUTPUT_PATH, JSON.stringify(sources, null, 2), "utf8");
}

router.get("/", (req, res) => {
  res.sendFile(SOURCES_OUTPUT_PATH);
});

// Cache on each start
cacheSources();

export default router;
