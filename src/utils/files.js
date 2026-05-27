import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const IGNORED = new Set([".git", "node_modules", "dist", "coverage", ".next"]);

export async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function walk(root, predicate = () => true, dir = "") {
  const absolute = path.join(root, dir);
  let entries;
  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const relative = path.join(dir, entry.name).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      if (!IGNORED.has(entry.name)) files.push(...(await walk(root, predicate, relative)));
      continue;
    }
    if (predicate(relative)) files.push(relative);
  }
  return files.sort();
}

export async function readText(root, relative) {
  return readFile(path.join(root, relative), "utf8");
}

export async function readJson(root, relative) {
  return JSON.parse(await readText(root, relative));
}
