import PromiseRouter from "express-promise-router";
import _ from "lodash";
import articlesDb from "../../db/articles.js";
import batchesDb from "../../db/batches.js";
import clusterMaker from "clusters";
import { getBagOfWords } from "../../utils.js";
import linksDb from "../../db/links.js";
import luxon from "luxon";
import { mapTo } from "../../db/utils.js";
import sourcesDb from "../../db/sources.js";

const { DateTime } = luxon;
const router = PromiseRouter();

function prioritizeRequestedSources(linkGroups, sourceIds) {
  return linkGroups.map((g) => {
    return g.sort((a, b) => {
      const aIsRequestSource = _.includes(sourceIds, a.sourceId);
      const bIsRequestSource = _.includes(sourceIds, b.sourceId);

      if (aIsRequestSource && bIsRequestSource) {
        return 0;
      } else if (aIsRequestSource) {
        return -1;
      } else {
        return 1;
      }
    });
  });
}

function getTopArticles(links, count = 5) {
  const bow = getBagOfWords(links);

  clusterMaker.k(count);
  clusterMaker.iterations(500);
  clusterMaker.data(bow);
  const clusters = clusterMaker.clusters();
  const articles = [];

  clusters.forEach((c) => {
    console.log("-- cluster");

    articles.push(links[bow.indexOf(c.points[0])].article);

    c.points.forEach((p) => {
      const point = links[bow.indexOf(p)];

      console.debug(point.position, point.article.title);
    });
  });

  return articles;
}

router.get("/", async (req, res) => {
  const sourceIds = (req.query.sourceIds || "ap-news").split(",");
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : 1;

  const batch = await batchesDb.getLatest();
  const linkGroups = prioritizeRequestedSources(
    await linksDb.getGroupsBySourceIds(sourceIds, batch.id, categoryId),
    sourceIds
  );

  const links = _.flatten(linkGroups);
  const articleIds = _.map(links, "articleId");
  const articles = await articlesDb.getByIds(articleIds)

  res.json(articles);
});

router.get("/top", async (req, res) => {
  const sourceIds = (req.query.sourceIds || "ap-news").split(",");
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : 1;

  const batch = await batchesDb.getLatest();
  const expandedSourceIds = await sourcesDb.getRelatedIds(sourceIds);
  const linkGroups = prioritizeRequestedSources(
    await linksDb.getGroupsBySourceIds(expandedSourceIds, batch.id, categoryId),
    sourceIds
  );

  const links = _.flatten(linkGroups);
  const articleIds = _.map(links, "articleId");

  const termVectorsMap = mapTo(await articlesDb.getTermVectorsByIds(articleIds), "id");
  const articlesMap = mapTo(await articlesDb.getByIds(articleIds), "id");

  links.forEach((l) => {
    l.terms = termVectorsMap[l.articleId].terms;
    l.article = articlesMap[l.articleId];
  });

  const articles = getTopArticles(links);

  res.json(links);
});

export default router;
