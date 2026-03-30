import fs from "fs-extra";
import { basename, dirname, resolve } from "pathe";
import type { ScaffoldAnswers } from "../schema.js";
import { scaffoldAnswersSchema } from "../schema.js";

export const SCAFFOLD_VERSION = 1;

export interface AgentScaffoldManifest extends ScaffoldAnswers {
  scaffoldVersion: number;
  generatedAt: string;
  googlePatternGuide: string;
}

export function buildManifest(answers: ScaffoldAnswers): AgentScaffoldManifest {
  return {
    ...answers,
    scaffoldVersion: SCAFFOLD_VERSION,
    generatedAt: new Date().toISOString(),
    googlePatternGuide:
      "https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system",
  };
}

/**
 * Read `agent.scaffold.json` and validate answers. Extra fields (e.g. scaffoldVersion) are ignored.
 *
 * When `outputDir` is omitted, it is inferred only if the manifest path is
 * `<parent>/<projectName>/agent.scaffold.json` so the parent of the project folder is unambiguous.
 */
export async function loadScaffoldAnswersFromAgentFile(
  manifestPath: string,
  options: { outputDir?: string; cwd?: string } = {},
): Promise<{ answers: ScaffoldAnswers; outputDir: string }> {
  const cwd = options.cwd ?? process.cwd();
  const absManifest = resolve(cwd, manifestPath);
  const raw: unknown = await fs.readJSON(absManifest);
  const answers = scaffoldAnswersSchema.parse(raw);

  let outputDir: string;
  if (options.outputDir !== undefined && options.outputDir.length > 0) {
    outputDir = resolve(cwd, options.outputDir);
  } else {
    const projectRoot = dirname(absManifest);
    if (basename(projectRoot) !== answers.projectName) {
      throw new Error(
        `Cannot infer --output: the folder containing the manifest is "${basename(projectRoot)}" ` +
          `but projectName in the file is "${answers.projectName}". ` +
          `Pass -o with the parent directory that should contain "${answers.projectName}" (same as wizard output).`,
      );
    }
    outputDir = dirname(projectRoot);
  }

  return { answers, outputDir };
}
