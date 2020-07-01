import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const __dirname = path.resolve();
const OUTPUT_PATH = path.join(__dirname, ".cache", "sources.json");

function cache() {
  const dirname = "data/sources/";
  const sources = [];
  const filenames = fs.readdirSync(dirname);

  filenames.forEach(function (filename) {
    if (filename.endsWith(".yaml")) {
      const content = fs.readFileSync(dirname + filename, "utf-8");
      sources.push(yaml.safeLoad(content));
    }
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sources, null, 2), "utf8");
}

async function get() {
  return JSON.parse(await fs.promises.readFile(OUTPUT_PATH));
}

// Cache on each start
cache();

export default { get, OUTPUT_PATH };
