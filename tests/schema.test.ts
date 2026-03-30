import { describe, expect, it } from "vitest";
import {
  defaultApiKeyEnv,
  defaultModelForProvider,
  scaffoldAnswersSchema,
} from "../src/schema.js";

describe("scaffoldAnswersSchema", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = scaffoldAnswersSchema.parse({
      projectName: "test-agent",
      patternId: "single_agent",
      llm: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.2,
        maxTokens: 1024,
        apiKeyEnvVar: "OPENAI_API_KEY",
      },
      memory: "conversation",
      planning: "react_loop",
      prompts: "minimal",
      knowledge: "none",
      vectorBackend: "none",
      tools: [],
      mcpServers: [],
      includeMcpServerSkeleton: false,
      databaseUrlEnvVar: "DATABASE_URL",
      useSqlDatabase: false,
      generateClaudeHandoff: false,
      tryClaudeSpawn: false,
    });
    expect(parsed.projectName).toBe("test-agent");
  });

  it("rejects invalid project names", () => {
    expect(() =>
      scaffoldAnswersSchema.parse({
        projectName: "bad name",
        patternId: "single_agent",
        llm: {
          provider: "openai",
          model: "gpt-4o-mini",
          temperature: 0.2,
          maxTokens: 1024,
          apiKeyEnvVar: "OPENAI_API_KEY",
        },
        memory: "none",
        planning: "none",
        prompts: "minimal",
        knowledge: "none",
        vectorBackend: "none",
        tools: [],
      }),
    ).toThrow();
  });
});

describe("defaults", () => {
  it("maps providers to env keys", () => {
    expect(defaultApiKeyEnv("anthropic")).toBe("ANTHROPIC_API_KEY");
    expect(defaultApiKeyEnv("ollama")).toBe("OLLAMA_BASE_URL");
  });

  it("suggests models", () => {
    expect(defaultModelForProvider("google")).toContain("gemini");
    expect(defaultModelForProvider("anthropic")).toMatch(/^claude-/);
  });
});
