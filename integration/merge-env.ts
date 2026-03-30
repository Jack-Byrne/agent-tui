/**
 * Merge integration/.env (or path from AGENT_TUI_MASTER_ENV) into a generated project .env.
 * Existing fixture vars win unless overwriteMaster is true (default: master fills only missing).
 */
import fs from "fs-extra";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "pathe";

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function serializeEnv(rec: Record<string, string>): string {
  return (
    Object.entries(rec)
      .map(([k, v]) => `${k}=${v.includes(" ") ? JSON.stringify(v) : v}`)
      .join("\n") + "\n"
  );
}

export async function mergeEnvIntoProject(args: {
  projectRoot: string;
  masterEnvPath?: string;
  /** If true, master values override existing .env */
  overwrite?: boolean;
}): Promise<void> {
  const masterPath = resolve(
    args.masterEnvPath ??
      process.env.AGENT_TUI_MASTER_ENV ??
      resolve(process.cwd(), "integration/.env"),
  );
  if (!(await fs.pathExists(masterPath))) {
    return;
  }
  const master = parseEnv(await readFile(masterPath, "utf8"));
  const envFile = resolve(args.projectRoot, ".env");
  let existing: Record<string, string> = {};
  if (await fs.pathExists(envFile)) {
    existing = parseEnv(await readFile(envFile, "utf8"));
  }
  const merged = args.overwrite
    ? { ...existing, ...master }
    : { ...master, ...existing };
  await writeFile(envFile, serializeEnv(merged), "utf8");
}
