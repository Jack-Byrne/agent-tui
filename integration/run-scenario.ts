import fs from "fs-extra";
import { execFile as execFileCb } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { join, resolve } from "pathe";

const execFile = promisify(execFileCb);
import { assertRedisMemorySession } from "./assert-redis-memory.js";
import { seedPgVectorRagTable } from "./pgvector-seed.js";
import { generateProject } from "../src/generate/writer.js";
import { mergeEnvIntoProject } from "./merge-env.js";
import type { IntegrationScenario } from "./types.js";

const maxBuffer = 32 * 1024 * 1024;

async function npm(cwd: string, args: string[]): Promise<void> {
  await execFile("npm", args, {
    cwd,
    maxBuffer,
    env: process.env,
    encoding: "utf8",
  });
}

export async function runScenario(
  scenario: IntegrationScenario,
  outputParentDir: string,
  options: {
    liveLlm?: boolean;
    skipNpmInstall?: boolean;
    /** Delete project dir before generate. Default false so `integration-out/<id>/` keeps node_modules between runs. */
    clean?: boolean;
  } = {},
): Promise<{ stdout: string }> {
  const {
    liveLlm = false,
    skipNpmInstall = false,
    clean = process.env.AGENT_TUI_INTEGRATION_CLEAN === "1",
  } = options;
  const projectRoot = join(outputParentDir, scenario.id);

  if (clean) {
    await fs.remove(projectRoot);
  }
  await generateProject(outputParentDir, scenario.answers);
  await mergeEnvIntoProject({
    projectRoot,
    overwrite: liveLlm,
  });

  if (!skipNpmInstall) {
    await npm(projectRoot, ["install"]);
  }
  await npm(projectRoot, ["run", "build"]);

  if (scenario.sqlSmoke) {
    const { stdout: sOut } = await execFile("npm", ["run", "sql:smoke"], {
      cwd: projectRoot,
      maxBuffer,
      env: process.env,
      encoding: "utf8",
    });
    if (!String(sOut).includes("sql_smoke_ok")) {
      throw new Error(`sql:smoke failed for ${scenario.id}: ${sOut}`);
    }
  }

  if (scenario.assertMcpServerBuilt) {
    const mcpRoot = join(projectRoot, "mcp-servers", "custom");
    await npm(mcpRoot, ["install"]);
    await npm(mcpRoot, ["run", "build"]);
    if (!(await fs.pathExists(join(mcpRoot, "dist", "index.js")))) {
      throw new Error(`MCP server did not emit dist/index.js for ${scenario.id}`);
    }
  }

  let pgvectorAssert: { query: string; marker: string } | null = null;
  if (scenario.requiresPostgresPgvector) {
    const databaseUrl = process.env.DATABASE_URL;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!databaseUrl || !openaiApiKey) {
      throw new Error(
        `${scenario.id}: requires DATABASE_URL and OPENAI_API_KEY for pgvector seed`,
      );
    }
    pgvectorAssert = await seedPgVectorRagTable({
      databaseUrl,
      openaiApiKey,
      embeddingModel: process.env.EMBEDDING_MODEL,
    });
  }

  const childEnv = {
    ...process.env,
    AGENT_TUI_MOCK_LLM: liveLlm ? "0" : "1",
    AGENT_TUI_MOCK_SCENARIO: scenario.mockScenario ?? "default",
    ...scenario.runEnv,
  };

  const { stdout } = await execFile(
    "node",
    ["dist/index.js", "Hello integration"],
    {
      cwd: projectRoot,
      maxBuffer,
      env: childEnv,
      encoding: "utf8",
    },
  );

  const text = String(stdout);
  for (const frag of scenario.expectStdout ?? []) {
    if (!text.includes(frag)) {
      throw new Error(
        `Scenario ${scenario.id}: expected stdout fragment ${JSON.stringify(frag)}.\nGot:\n${text}`,
      );
    }
  }

  const minRedis = scenario.assertRedisMemoryMinMessages;
  if (minRedis != null && minRedis > 0) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error(
        `${scenario.id}: assertRedisMemoryMinMessages requires REDIS_URL`,
      );
    }
    const sessionId =
      scenario.runEnv?.AGENT_SESSION_ID ??
      process.env.AGENT_SESSION_ID ??
      "default";
    await assertRedisMemorySession({
      redisUrl,
      sessionId,
      minMessages: minRedis,
    });
  }

  if (pgvectorAssert) {
    const href = pathToFileURL(
      join(projectRoot, "dist/knowledge/knowledge.js"),
    ).href;
    const km = (await import(href)) as {
      retrieveContext: (q: string) => Promise<string>;
    };
    const ctx = await km.retrieveContext(pgvectorAssert.query);
    if (!ctx.includes(pgvectorAssert.marker)) {
      throw new Error(
        `${scenario.id}: pgvector retrieveContext missing marker. Got: ${ctx.slice(0, 400)}`,
      );
    }
  }

  return { stdout: text };
}

export function defaultIntegrationParentDir(): string {
  return resolve(process.cwd(), process.env.AGENT_TUI_INTEGRATION_OUT ?? "integration-out");
}
