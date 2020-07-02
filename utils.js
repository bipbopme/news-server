import _ from "lodash";
import fs from "fs";

export function initCache() {
  if (!fs.existsSync(".cache")) {
    fs.mkdirSync(".cache");
  }
}

export async function getCategories() {
  return JSON.parse(await fs.promises.readFile("data/taxonomy.json"));
}

export function getBagOfWords(links) {
  let terms = [];

  links.forEach((l) => {
    if (l.terms) {
      terms = _.union(terms, Object.keys(l.terms));
    }
  });

  let scores = [];

  links.forEach((l) => {
    let score = [];

    terms.forEach((t) => {
      if (l.terms && l.terms[t] && l.terms[t].score) {
        score.push(l.terms[t].score);
      } else {
        score.push(0);
      }
    });

    scores.push(score);
  });

  return scores;
}