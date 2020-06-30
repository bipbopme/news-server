import { getArticlesByIds, getLatestBatch, getLinks } from "../../db.js";

import _ from "lodash";
import express from "express";
import luxon from "luxon";

const { DateTime } = luxon;
const router = express.Router();

router.get("/", async (req, res) => {
  const sourceIds = (req.query.sourceIds || "").split(",");
  const categoryId = req.query.categoryId || "16";

  const batch = await getLatestBatch();
  const groupings = [];

  await Promise.all(
    sourceIds.map(async (sourceID) => {
      const links = await getLinks(batch.id, categoryId, sourceID);

      links.forEach((l, i) => {
        groupings[i] = groupings[i] || [];
        groupings[i].push(l);
      });
    })
  );

  let orderedArticleIds = [];
  groupings.forEach((g) => {
    g.sort((a, b) => DateTime.fromISO(a) - DateTime.fromISO(b)).forEach((l) =>
      orderedArticleIds.push(l.articleId)
    );
  });

  const articlesMap = await getArticlesByIds(orderedArticleIds);
  const orderedArticles = orderedArticleIds.map((id) => articlesMap[id]);

  res.json(orderedArticles);
});

export default router;
