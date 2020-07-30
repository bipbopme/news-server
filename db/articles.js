import ImgixClient from "imgix-core-js";
import { search as elasticSearch } from "./utils.js";
import elasticsearch from "@elastic/elasticsearch";
const es = new elasticsearch.Client({ node: "http://localhost:9200" });

export async function search(q, sourceIds, days = 7, size = 25) {
  return await elasticSearch({
    index: "articles",
    body: {
      min_score: 10,
      query: {
        function_score: {
          functions: [
            {
              gauss: {
                firstSeenAt: {
                  origin: "now",
                  scale: `${days}d`,
                  offset: "12h",
                  decay: 0.5
                }
              }
            }
          ],
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: q,
                    fields: ["title^2", "description"],
                    type: "best_fields",
                    operator: "and"
                  }
                }
              ],
              filter: [
                { range: { firstSeenAt: { gte: `now-${days}d` } } },
                {
                  terms: {
                    "sourceId.keyword": sourceIds
                  }
                },
                {
                  exists: {
                    field: "imageUrl"
                  }
                }
              ]
            }
          }
        }
      },
      _source: [
        "id",
        "sourceId",
        "categoryIds",
        "title",
        "description",
        "imageUrl",
        "publishDate",
        "url",
        "ampUrl",
        "firstSeenAt"
      ],
      size: size
    }
  });
}

export async function getByIds(ids, size = 1000) {
  const articles = await elasticSearch({
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
        "imageUrl",
        "publishDate",
        "url",
        "ampUrl",
        "firstSeenAt"
      ],
      size: size
    }
  });

  let orderedArticles = [];

  ids.forEach((id) => {
    orderedArticles.push(articles.find((a) => a.id === id));
  });

  return orderedArticles;
}

export async function get(categoryIds, sourceIds, size = 100) {
  return await elasticSearch({
    index: "articles",
    body: {
      query: {
        bool: {
          filter: [
            {
              terms: {
                categoryIds: categoryIds
              }
            },
            {
              terms: {
                "sourceId.keyword": sourceIds
              }
            },
            {
              exists: {
                field: "imageUrl"
              }
            }
          ]
        }
      },
      _source: [
        "id",
        "sourceId",
        "categoryIds",
        "title",
        "description",
        "imageUrl",
        "publishDate",
        "url",
        "ampUrl",
        "firstSeenAt"
      ],
      size: size,
      sort: [{ firstSeenAt: "desc" }]
    }
  });
}

async function getTermVectors(id) {
  const { body } = await es.termvectors({
    index: "articles",
    id: id,
    body: {
      fields: ["clusterText"],
      positions: false,
      offsets: false,
      field_statistics: false,
      term_statistics: false,
      payloads: false,
      filter: { max_num_terms: 10 }
    }
  });

  return body.term_vectors?.clusterText?.terms;
}

async function getTermVectorsByIds(ids) {
  const termVectors = [];

  await Promise.all(
    ids.map(async (id) => {
      const terms = await getTermVectors(id);

      termVectors.push({ id, terms });
    })
  );

  return termVectors;
}

function enhance(articles, sourcesMap) {
  const imgix = new ImgixClient({
    domain: process.env.IMGIX_DOMAIN,
    secureURLToken: process.env.IMGIX_TOKEN
  });

  articles.forEach((a) => {
    const source = sourcesMap[a.sourceId];

    a.imageUrl = imgix.buildURL(a.imageUrl, { w: 500, h: 500 });

    a.source = {
      name: source.name,
      iconUrl: imgix.buildURL(source.iconUrl, { w: 32, h: 32 })
    };
  });
}

export default { get, getByIds, getTermVectorsByIds, enhance, search };
