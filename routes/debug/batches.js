import batchesDb from "../../db/batches.js";
import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  const batches = await batchesDb.get(10);

  res.render("debug/batches/index", { batches });
});

export default router;
