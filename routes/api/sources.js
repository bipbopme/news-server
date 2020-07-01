import express from "express";
import sources from "../../db/sources.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(sources.OUTPUT_PATH);
});

export default router;
