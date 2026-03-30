import fs from "fs-extra";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect, it } from "vitest";
import {
  buildManifest,
  loadScaffoldAnswersFromAgentFile,
} from "../src/generate/manifest.js";
import { scaffoldAnswersSchema } from "../src/schema.js";
import type { ScaffoldAnswers } from "../src/schema.js";

function minimalAnswers(overrides: Partial<ScaffoldAnswers> = {}): ScaffoldAnswers {
  return {
    projectName: "fixture-agent",
    patternId: "single_agent",
    llm: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0,
      maxTokens: 100,
      apiKeyEnvVar: "OPENAI_API_KEY",
    },
    memory: "none",
    planning: "none",
    prompts: "minimal",
    knowledge: "none",
    vectorBackend: "none",
    tools: [],
    mcpServers: [],
    includeMcpServerSkeleton: false,
    databaseUrlEnvVar: "DATABASE_URL",
    useSqlDatabase: false,
    sqlBootstrap: "connection_url",
    sqliteFilePath: "data/local.db",
    generateClaudeHandoff: false,
    tryClaudeSpawn: false,
    ...overrides,
  };
}

describe("buildManifest / scaffold file parsing", () => {
  it("scaffoldAnswersSchema strips manifest-only fields", () => {
    const file = buildManifest(minimalAnswers());
    const parsed = scaffoldAnswersSchema.parse(file);
    expect(parsed.projectName).toBe("fixture-agent");
    expect("scaffoldVersion" in parsed).toBe(false);
  });

  it("loadScaffoldAnswersFromAgentFile infers parent output dir", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-tui-manifest-"));
    const projectRoot = join(root, "fixture-agent");
    await fs.mkdir(projectRoot, { recursive: true });
    const manifestPath = join(projectRoot, "agent.scaffold.json");
    await fs.writeJSON(manifestPath, buildManifest(minimalAnswers()), { spaces: 2 });

    const result = await loadScaffoldAnswersFromAgentFile(manifestPath);
    expect(result.outputDir).toBe(root);
    expect(result.answers.projectName).toBe("fixture-agent");
  });

  it("loadScaffoldAnswersFromAgentFile respects -o when passed explicitly", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-tui-manifest-"));
    const manifestPath = join(root, "agent.scaffold.json");
    await fs.writeJSON(
      manifestPath,
      buildManifest(minimalAnswers({ projectName: "x" })),
      { spaces: 2 },
    );

    const customParent = join(root, "custom-out");
    const result = await loadScaffoldAnswersFromAgentFile(manifestPath, {
      outputDir: customParent,
    });
    expect(result.outputDir).toBe(customParent);
  });
});
