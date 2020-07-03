import ImgixClient from "imgix-core-js";
import elasticsearch from "@elastic/elasticsearch";
import { search } from "./utils.js";
const es = new elasticsearch.Client({ node: "http://localhost:9200" });

export async function getByIds(ids, size = 1000) {
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
        "imageUrl",
        "publishDate",
        "url",
        "ampUrl",
        "firstCrawledAt"
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
  console.log(categoryIds, sourceIds);
  return await search({
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

export default { get, getByIds, getTermVectorsByIds, enhance };
