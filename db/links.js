import { search } from "./utils.js";

async function getByBatchId(batchID, categoryId, sourceId, size = 10) {
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

async function getGroupsBySourceIds(sourceIds, batchId, categoryId, size = 10) {
  const linkGroups = [];

  await Promise.all(
    sourceIds.map(async (sourceId) => {
      const links = await getByBatchId(batchId, categoryId, sourceId, size);

      links.forEach((l, i) => {
        // Renumber with absolute values
        l.position = i;
        
        linkGroups[i] = linkGroups[i] || [];
        linkGroups[i].push(l);
      });
    })
  );

  return linkGroups;
}

export default { getByBatchId, getGroupsBySourceIds };
