import fs from "fs-extra";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect, it } from "vitest";
import { generateProject } from "../src/generate/writer.js";
import type { ScaffoldAnswers } from "../src/schema.js";

function baseAnswers(overrides: Partial<ScaffoldAnswers> = {}): ScaffoldAnswers {
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

async function listFiles(root: string, rel = ""): Promise<string[]> {
  const entries = await fs.readdir(join(root, rel), { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(root, r)));
    else out.push(r);
  }
  return out.sort();
}

describe("generateProject", () => {
  it("writes expected tree for single_agent", async () => {
    const parent = await mkdtemp(join(tmpdir(), "agent-tui-"));
    await generateProject(parent, baseAnswers());

    const proj = join(parent, "fixture-agent");
    const files = await listFiles(proj);
    expect(files).toContain("package.json");
    expect(files).toContain("agent.scaffold.json");
    expect(files).toContain("src/index.ts");
    expect(files).toContain("src/agents/single-agent.ts");
    expect(files).toContain("config/mcp.example.json");
  });

  it("includes MCP skeleton when requested", async () => {
    const parent = await mkdtemp(join(tmpdir(), "agent-tui-"));
    await generateProject(
      parent,
      baseAnswers({ includeMcpServerSkeleton: true }),
    );
    const proj = join(parent, "fixture-agent");
    const files = await listFiles(proj);
    expect(files.some((f) => f.includes("mcp-servers/custom"))).toBe(true);
  });

  it("writes coordinator layout", async () => {
    const parent = await mkdtemp(join(tmpdir(), "agent-tui-"));
    await generateProject(
      parent,
      baseAnswers({ patternId: "coordinator" }),
    );
    const proj = join(parent, "fixture-agent");
    const files = await listFiles(proj);
    expect(files).toContain("src/agents/coordinator.ts");
    expect(files).toContain("src/agents/workers/search.ts");
  });

  it("writes docker-compose when Docker Postgres bootstrap is chosen", async () => {
    const parent = await mkdtemp(join(tmpdir(), "agent-tui-"));
    await generateProject(
      parent,
      baseAnswers({
        useSqlDatabase: true,
        sqlBootstrap: "docker_postgres",
      }),
    );
    const proj = join(parent, "fixture-agent");
    const files = await listFiles(proj);
    expect(files).toContain("docker-compose.yml");
    const yml = await fs.readFile(join(proj, "docker-compose.yml"), "utf8");
    expect(yml).toContain("postgres:16-alpine");
  });

  it("uses better-sqlite3 when SQLite bootstrap is chosen", async () => {
    const parent = await mkdtemp(join(tmpdir(), "agent-tui-"));
    await generateProject(
      parent,
      baseAnswers({
        useSqlDatabase: true,
        sqlBootstrap: "sqlite_file",
        sqliteFilePath: "data/app.db",
      }),
    );
    const proj = join(parent, "fixture-agent");
    const pkg = await fs.readJSON(join(proj, "package.json"));
    expect(pkg.dependencies["better-sqlite3"]).toBeDefined();
    expect(pkg.dependencies.pg).toBeUndefined();
    const stub = await fs.readFile(join(proj, "src/db/drizzle-stub.ts"), "utf8");
    expect(stub).toContain("better-sqlite3");
    expect(stub).toContain("data/app.db");
  });
});
