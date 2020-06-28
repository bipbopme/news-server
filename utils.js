import fs from "fs";

export function initCache() {
  if (!fs.existsSync(".cache")) {
    fs.mkdirSync(".cache");
  }
}

export async function getCategoriesMap() {
  const taxonomy = JSON.parse(await fs.promises.readFile("data/taxonomy.json"));

  let map = {};

  taxonomy.forEach(c => map = { ...map, ...c });

  return map;
}