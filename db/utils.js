import elasticsearch from "@elastic/elasticsearch";

const es = new elasticsearch.Client({ node: "http://localhost:9200" });

export async function search(doc) {
  const { body } = await es.search(doc);
  return body.hits.hits.map((h) => h._source);
}

export function indexBy(items, attr) {
  const mappedItems = {};

  items.forEach((i) => (mappedItems[i[attr]] = i));

  return mappedItems;
}