import { search } from "./utils.js";

export async function getByBatchId(batchID, categoryId, sourceId, size = 10) {
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
                "categoryId": categoryId
              }
            },
            {
              term: {
                "sourceId.keyword": sourceId
              }
            }
          ]
        }
      },
      sort: { position: "asc" },
      size: size
    }
  });
}

export default { getByBatchId };
