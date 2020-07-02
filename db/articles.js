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
      filter: { max_num_terms: 5 }
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

export default { getByIds, getTermVectorsByIds };
