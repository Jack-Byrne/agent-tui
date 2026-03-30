import fs from "node:fs";
import { basename, join } from "pathe";

const MANIFEST = "agent.scaffold.json";

/**
 * Subdirectories of `parentDir` that contain `agent.scaffold.json`, sorted by name.
 * Paths are absolute (resolved from `parentDir`).
 */
export function listAgentProjectRoots(parentDir: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(parentDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const roots: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const root = join(parentDir, e.name);
    const manifestPath = join(root, MANIFEST);
    try {
      if (fs.statSync(manifestPath).isFile()) roots.push(root);
    } catch {
      /* skip */
    }
  }
  return roots.sort((a, b) => basename(a).localeCompare(basename(b)));
}

export function manifestPathForProjectRoot(projectRoot: string): string {
  return join(projectRoot, MANIFEST);
}
