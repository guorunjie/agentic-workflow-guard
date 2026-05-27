import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));

export const packageVersion = packageJson.version;
export const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function packageVersionRange(version = packageVersion) {
  const [majorText] = version.split(".");
  const major = Number.parseInt(majorText, 10);
  const upperMajor = Number.isFinite(major) && major > 0 ? major + 1 : 1;
  return `>=${version} <${upperMajor}.0.0`;
}
