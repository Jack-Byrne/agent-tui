import type { ScaffoldAnswers } from "../schema.js";

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
