import _ from "lodash";
import articlesDb from "../../db/articles.js";
import batchesDb from "../../db/batches.js";
import express from "express";
import linksDb from "../../db/links.js";
import luxon from "luxon";
import { mapTo } from "../../db/utils.js";
import sourcesDb from "../../db/sources.js";

const { DateTime } = luxon;
const router = express.Router();

function clusterLinks(links) {
  const clusters = [];
  const hasBeenClustered = {};

  links.forEach((l) => {
    if (hasBeenClustered[l.id]) return;
    let cluster = [l];
    hasBeenClustered[l.id] = true;

    links.forEach((ll) => {
      if (hasBeenClustered[ll.id]) return;
      const intersection = _.intersection(l.terms, ll.terms);

      if (intersection.length / l.terms.length >= 0.2) {
        cluster.push(ll);
        hasBeenClustered[ll.id] = true;
      }
    });

    clusters.push(cluster);
  });

  return clusters;
}

function pickArticlesFromClusters(linkClusters) {
  const articles = [];

  linkClusters.forEach((c) => {
    c[0].article.position = c[0].position;
    articles.push(c[0].article);
  });

  return articles;
}

router.get("/", async (req, res) => {
  const sourceIds = (req.query.sourceIds || "").split(",");
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : 1;

  const batch = await batchesDb.getLatest();
  const expandedSourceIds = await sourcesDb.getRelatedIds(sourceIds);
  const links = _.flatten(
    await linksDb.getGroupsBySourceIds(expandedSourceIds, batch.id, categoryId)
  );
  const articleIds = _.map(links, "articleId");

  const termVectorsMap = mapTo(await articlesDb.getTermVectorsByIds(articleIds), "id");
  const articlesMap = mapTo(await articlesDb.getByIds(articleIds), "id");

  links.forEach((l) => {
    l.terms = termVectorsMap[l.articleId].terms;
    l.article = articlesMap[l.articleId];
  });

  const linkClusters = clusterLinks(links);
  const articles = pickArticlesFromClusters(linkClusters);

  res.json(articles);
});

export default router;
