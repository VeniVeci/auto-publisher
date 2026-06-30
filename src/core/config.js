import fs from "node:fs/promises";
import path from "node:path";

export async function loadConfig(configPath = "config/config.json") {
  const absPath = path.resolve(configPath);
  try {
    const raw = await fs.readFile(absPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const example = path.resolve("config/config.example.json");
    const raw = await fs.readFile(example, "utf8");
    return JSON.parse(raw);
  }
}

export function outputRoot(config) {
  return path.resolve(config.outputDir || "outputs");
}
