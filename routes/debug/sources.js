import express from "express";
import fetch from "isomorphic-unfetch";
import { getCategoriesMap } from "../../utils.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const response = await fetch("http://localhost:5500/api/sources");
  const sources = await response.json();
  const categories = await getCategoriesMap();

  res.render("debug/sources/index", { sources, categories });
});

export default router;
