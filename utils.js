import { existsSync, mkdirSync } from "fs";

export function initCache() {
  if (!existsSync(".cache")) {
    mkdirSync(".cache");
  }
}
