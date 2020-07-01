import { search } from "./utils.js";

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

  ids.forEach(id => {
    orderedArticles.push(articles.find((a) => a.id === id));
  });

  return orderedArticles;
}

export default { getByIds }