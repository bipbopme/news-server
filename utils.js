import fs from "fs";

export function initCache() {
  if (!fs.existsSync(".cache")) {
    fs.mkdirSync(".cache");
  }
}

export async function getCategories() {
  return JSON.parse(await fs.promises.readFile("data/taxonomy.json"));
}