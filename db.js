import elasticsearch from "@elastic/elasticsearch";

const es = new elasticsearch.Client({ node: "http://localhost:9200" });

export async function search(doc) {
  const { body } = await es.search(doc);
  return body.hits.hits.map((h) => h._source);
}

export async function getLatestBatch() {
  const batches = await search({
    index: "batches",
    body: {
      query: { match_all: {} },
      sort: { started_at: "desc" },
      size: 1
    }
  });

  return batches[0];
}

export async function getLinks(batchID, categoryId, sourceID) {
  return search({
    index: "links",
    body: {
      query: {
        bool: {
          must: [
            {
              term: {
                "batchId.keyword": batchID
              }
            },
            {
              term: {
                "categoryId.keyword": categoryId
              }
            },
            {
              term: {
                "sourceId.keyword": sourceID
              }
            }
          ]
        }
      },
      sort: { position: "asc" },
      size: 10
    }
  });
}

export async function getArticlesByIds(ids) {
  const articles = await search({
    index: "articles",
    body: {
      query: {
        terms: {
          _id: ids
        }
      },
      _source: [
        "id",
        "sourceId",
        "categoryIds",
        "title",
        "description",
        "image",
        "publishDate",
        "url",
        "ampUrl",
        "firstCrawledAt"
      ],
      size: 1000
    }
  });

  const map = {};
  articles.forEach((a) => (map[a.id] = a));

  return map;
}
