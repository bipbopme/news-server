import _ from "lodash";
import elasticsearch from "@elastic/elasticsearch";
import express from "express";

const es = new elasticsearch.Client({ node: "http://localhost:9200" });
const router = express.Router();

async function search(doc) {
  const { body } = await es.search(doc);
  return body.hits.hits.map((h) => h._source);
}

async function getLatestBatch() {
  const batches = await search({
    index: "batches",
    body: {
      query: { match_all: {} },
      sort: { started_at: "desc" },
      size: 1,
    },
  });

  return batches[0];
}

async function getLinks(batchID, categoryId, sourceID) {
  return search({
    index: "links",
    body: {
      query: {
        bool: {
          must: [
            {
              term: {
                "batchId.keyword": batchID,
              },
            },
            {
              term: {
                "categoryId.keyword": categoryId,
              },
            },
            {
              term: {
                "sourceId.keyword": sourceID,
              },
            },
          ],
        },
      },
      sort: { position: "asc" },
      size: 10,
    },
  });
}

router.get("/top", async (req, res) => {
  const sourceIDs = [
    "the-new-york-times",
    "ap-news",
    "newsmax",
    "fox-news",
  ];
  const categoryId = "16";
  const batch = await getLatestBatch();

  const groupings = [];

  await Promise.all(
    sourceIDs.map(async (sourceID) => {
      const links = await getLinks(batch.id, categoryId, sourceID);

      links.forEach((l, i) => {
        groupings[i] = groupings[i] || [];
        groupings[i].push(l);
      });
    })
  );

  let articles = [];

  groupings.forEach((c) => (articles = articles.concat(_.shuffle(c))));

  res.json(batch);
});

export default router;
