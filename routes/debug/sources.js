import express from "express";
import fetch from "isomorphic-unfetch";

const router = express.Router();

router.get("/", async (req, res) => {
  const response = await fetch("http://localhost:5500/api/sources");
  const sources = await response.json();

  res.render("debug/sources/index", { sources });
});

export default router;
