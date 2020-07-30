import PromiseRouter from "express-promise-router";
import _ from "lodash";
import articlesDb from "../../db/articles.js";
import batchesDb from "../../db/batches.js";
import clusterMaker from "clusters";
import { indexBy } from "../../db/utils.js";
import kmpp from "kmpp";
import linksDb from "../../db/links.js";
import luxon from "luxon";
import natural from "natural";
import sourcesDb from "../../db/sources.js";

const { DateTime } = luxon;
const router = PromiseRouter();

function tokenizeAndStem(text) {
  return natural.LancasterStemmer.tokenizeAndStem(text);
}

function getDict(texts) {
  let words = [];

  texts.forEach((t) => (words = _.union(words, t)));

  return words;
}

function getBow(text, dict) {
  const bow = [];

  dict.forEach((d) => bow.push(_.includes(text, d) ? 1 : 0));

  return bow;
}

function getTopArticlesTwo(links, limit = 10) {
  const titles = links.map((l) => tokenizeAndStem(l.article.title));
  const dict = getDict(titles);
  const bow = titles.map((t) => getBow(t, dict));

  console.log(dict);

  const result = kmpp(bow, { k: limit, norm: 2 });
  let linkClusters = [];
  result.assignments.forEach((a, i) => {
    linkClusters[a] = linkClusters[a] || [];
    linkClusters[a].push(links[i]);
  });

  // clusterMaker.k(limit);
  // clusterMaker.iterations(100);
  // clusterMaker.data(bow);
  // const clusters = clusterMaker.clusters();
  // let linkClusters = clusters.map((c) => c.points.map((p) => links[bow.indexOf(p)]));

  // Sort by the average position of the cluster
  linkClusters = _.sortBy(
    linkClusters,
    (lc) =>
      lc
        .map((l) => l.position)
        .slice(0, 2)
        .reduce((a, b) => a + b, 0) / lc.length
  );

  // Just for debugging
  linkClusters.forEach((lc) => {
    console.log("-- cluster");
    lc.forEach((l) => {
      console.debug(l.position, l.article.title);
    });
  });

  return linkClusters.map((lc) => lc[0].article);
}

router.get("/", async (req, res) => {
  const sourceIds = (req.query.sourceIds || "ap-news").split(",");
  const categoryIds = (req.query.categoryIds || "1").split(",").map((id) => parseInt(id));

  const sourcesIndex = indexBy(await sourcesDb.get(), "id");
  const expandedSourceIds = await sourcesDb.getRelatedIds(sourcesIndex, sourceIds);
  const articles = await articlesDb.get(categoryIds, expandedSourceIds);

  articlesDb.enhance(articles, sourcesIndex);

  res.json(articles);
});

router.get("/top", async (req, res) => {
  const sourceIds = (req.query.sourceIds || "ap-news").split(",");
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 5;

  const sourcesIndex = indexBy(await sourcesDb.get(), "id");
  const batch = await batchesDb.getLatest();
  const expandedSourceIds = await sourcesDb.getRelatedIds(sourcesIndex, sourceIds);
  const linkGroups = await linksDb.getGroupsBySourceIds(expandedSourceIds, batch.id, categoryId);
  const links = _.flatten(linkGroups);
  const articleIds = _.map(links, "articleId");
  // const termVectorsIndex = indexBy(await articlesDb.getTermVectorsByIds(articleIds), "id");
  const articlesIndex = indexBy(await articlesDb.getByIds(articleIds), "id");

  links.forEach((l) => {
    // l.terms = termVectorsIndex[l.articleId].terms;
    l.article = articlesIndex[l.articleId];
  });

  const articles = getTopArticlesTwo(links, limit).slice(0, limit);
  articlesDb.enhance(articles, sourcesIndex);

  res.json(articles);
});

router.get("/search", async (req, res) => {
  const sources = await sourcesDb.get();
  const sourcesIndex = indexBy(sources, "id");
  const sourceIds = sources.filter((s) => s.reliability >= 40).map((s) => s.id);

  const articles = await articlesDb.search(req.query.q, sourceIds);

  articlesDb.enhance(articles, sourcesIndex);

  res.json(articles);
});

export default router;
