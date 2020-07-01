import { getArticlesByIds, getLinks } from "../../db.js";

import _ from "lodash";
import articlesDb from "../../db/articles.js";
import batchesDb from "../../db/batches.js";
import express from "express";
import linksDb from "../../db/links.js";
import luxon from "luxon";

const { DateTime } = luxon;
const router = express.Router();

router.get("/", async (req, res) => {
  const sourceIds = (req.query.sourceIds || "").split(",");
  const categoryId = req.query.categoryId || 1;

  const batch = await batchesDb.getLatest();
  const groupings = [];

  await Promise.all(
    sourceIds.map(async (sourceId) => {
      const links = await linksDb.getByBatchId(batch.id, categoryId, sourceId);

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

  const articles = await articlesDb.getByIds(orderedArticleIds);

  res.json(articles);
});

export default router;
