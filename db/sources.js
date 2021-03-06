import _ from "lodash";
import fs from "fs";
import { indexBy } from "./utils.js";
import path from "path";
import yaml from "js-yaml";

let cachedSources;

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
  if (!cachedSources) {
    cachedSources = JSON.parse(await fs.promises.readFile(OUTPUT_PATH));
  }

  return cachedSources;
}

function getBiasSpread(sourcesIndex, sourceIds) {
  const biases = sourceIds.map((id) => sourcesIndex[id].bias);

  return {
    min: Math.min(...biases),
    max: Math.max(...biases)
  };
}

function getExpandedBiasSpread(sourcesIndex, sourceIds, expandBy = 10) {
  const MIN_LEFT_BIAS = -20;
  const MAX_RIGHT_BIAS = 20;
  let { min, max } = getBiasSpread(sourcesIndex, sourceIds);

  const padding = expandBy / 2;
  const paddedMin = min - padding >= MIN_LEFT_BIAS ? min - padding : min;
  const paddedMax = max + padding <= MAX_RIGHT_BIAS ? max + padding : max;

  // pad evenly
  if (min < 0 && max > 0) {
    min = paddedMin;
    max = paddedMax;
  }
  // pad partisan left more on the right
  else if (max < 0) {
    min = paddedMin;
    max = max + expandBy;
  }
  // pad partisan right more on the left
  else if (min > 0) {
    min = min - expandBy;
    max = paddedMax;
  }

  return { min, max };
}

async function getRelatedIds(sourcesIndex, sourceIds, categoryId = 1, limit = 5, inclusive = true) {
  const { min, max } = getExpandedBiasSpread(sourcesIndex, sourceIds);
  let relatedSources = [];

  Object.values(sourcesIndex).forEach((source) => {
    if (!source.bias) return;

    const section = source.sections.find((section) => section.categoryId == categoryId);

    if (section && source.bias >= min && source.bias <= max && !_.includes(sourceIds, source.id)) {
      relatedSources.push(source);
    }
  });

  // Sort by popularity
  relatedSources = _.sortBy(relatedSources, "alexaRank");

  // Gather the ids
  let relatedSourceIds = relatedSources.map((s) => s.id);

  // Put the original IDs up front if desired
  if (inclusive) {
    relatedSourceIds = sourceIds.concat(relatedSourceIds);
  }

  // Limit to the number provided
  relatedSourceIds = relatedSourceIds.slice(0, limit);

  return relatedSourceIds;
}

// Cache on each start
cache();

export default { get, getRelatedIds, OUTPUT_PATH };
