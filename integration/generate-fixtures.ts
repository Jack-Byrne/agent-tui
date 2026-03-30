import { mkdir } from "node:fs/promises";
import { resolve } from "pathe";
import { generateProject } from "../src/generate/writer.js";
import { integrationScenarios } from "./scenarios.js";
import { defaultIntegrationParentDir } from "./run-scenario.js";

/**
 * Mass-generate projects under integration-out/ (or AGENT_TUI_INTEGRATION_OUT).
 * Does not install deps or run agents — use integration/run.ts for that.
 */
async function main() {
  const out = defaultIntegrationParentDir();
  await mkdir(out, { recursive: true });

  const only = process.argv[2];
  const list = only
    ? integrationScenarios.filter((s) => s.id === only)
    : integrationScenarios;

  for (const s of list) {
    await generateProject(out, s.answers);
    console.log("generated", resolve(out, s.id));
  }
}

void main();
