import { search } from "./utils.js";

export async function get(size = 10) {
  return search({
    index: "batches",
    body: {
      query: { match_all: {} },
      sort: { started_at: "desc" },
      size: size
    }
  });
}

export async function getLatest() {
  const batches = await get(1);

  return batches[0];
}

export default { get, getLatest }