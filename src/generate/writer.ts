import fs from "fs-extra";
import Handlebars from "handlebars";
import { dirname, join, relative } from "pathe";
import { fileURLToPath } from "node:url";
import type { ScaffoldAnswers } from "../schema.js";
import { buildManifest } from "./manifest.js";
import { buildTemplateContext } from "./context.js";
import { writeClaudeHandoff } from "./claude-handoff.js";
import { spawnClaudeOptional } from "./claude-spawn.js";
import { writeMcpExample } from "./mcp-config.js";
import { writeDockerComposeIfNeeded } from "./docker-compose.js";

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("json", (ctx: unknown) => JSON.stringify(ctx, null, 2));

function templateRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/generate/writer.js -> ../../templates
  // src/generate/writer.ts (tsx) -> ../../templates
  return join(here, "..", "..", "templates");
}

async function listFilesRecursive(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else out.push(full);
    }
  }
  await walk(root);
  return out;
}

async function renderTree(args: {
  srcRoot: string;
  outRoot: string;
  context: Record<string, unknown>;
}): Promise<void> {
  const { srcRoot, outRoot, context } = args;
  if (!(await fs.pathExists(srcRoot))) return;

  const files = await listFilesRecursive(srcRoot);
  for (const abs of files) {
    const rel = relative(srcRoot, abs);
    const isHbs = rel.endsWith(".hbs");
    const targetRel = isHbs ? rel.slice(0, -".hbs".length) : rel;
    const targetAbs = join(outRoot, targetRel);
    await fs.mkdir(dirname(targetAbs), { recursive: true });

    if (isHbs) {
      const tpl = await fs.readFile(abs, "utf8");
      const compiled = Handlebars.compile(tpl, { noEscape: false });
      const body = compiled(context);
      await fs.writeFile(targetAbs, body, "utf8");
    } else {
      await fs.copy(abs, targetAbs);
    }
  }
}

export interface GenerateResult {
  outputDir: string;
  claudeSpawnStdout?: string;
  claudeSpawnNote?: string;
}

export async function generateProject(
  outputDir: string,
  answers: ScaffoldAnswers,
): Promise<GenerateResult> {
  const absOut = join(outputDir, answers.projectName);
  await fs.mkdir(absOut, { recursive: true });

  const root = templateRoot();
  const context = buildTemplateContext(answers) as unknown as Record<
    string,
    unknown
  >;

  const sharedDir = join(root, "shared");
  const topoDir = join(root, "topologies", String(context.topology));
  const mcpDir = join(root, "mcp-skeleton");

  await renderTree({ srcRoot: sharedDir, outRoot: absOut, context });
  await renderTree({ srcRoot: topoDir, outRoot: absOut, context });

  if (answers.includeMcpServerSkeleton) {
    await renderTree({ srcRoot: mcpDir, outRoot: absOut, context });
  }

  const manifest = buildManifest(answers);
  await fs.writeJSON(join(absOut, "agent.scaffold.json"), manifest, {
    spaces: 2,
  });

  await writeMcpExample(absOut, answers);
  await writeDockerComposeIfNeeded(absOut, answers);

  if (answers.generateClaudeHandoff) {
    await writeClaudeHandoff(absOut, answers);
  }

  let claudeSpawnStdout: string | undefined;
  let claudeSpawnNote: string | undefined;
  if (answers.tryClaudeSpawn) {
    const spawnResult = await spawnClaudeOptional(absOut, answers);
    claudeSpawnStdout = spawnResult.stdout;
    claudeSpawnNote = spawnResult.note;
  }

  return { outputDir: absOut, claudeSpawnStdout, claudeSpawnNote };
}
