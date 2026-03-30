import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect, it } from "vitest";
import { integrationScenarios, quickScenarios } from "../../integration/scenarios.js";
import { runScenario } from "../../integration/run-scenario.js";

const scenarios =
  process.env.INTEGRATION_QUICK === "1"
    ? quickScenarios()
    : integrationScenarios;

describe("integration harness (mock LLM)", () => {
  for (const s of scenarios) {
    const needsRedis =
      s.requiresRedis ||
      (s.assertRedisMemoryMinMessages != null && s.assertRedisMemoryMinMessages > 0);
    const skipForRedis = Boolean(needsRedis && !process.env.REDIS_URL);
    const skipForPg =
      Boolean(s.requiresPostgresPgvector) &&
      (!process.env.DATABASE_URL || !process.env.OPENAI_API_KEY);
    const t = skipForRedis || skipForPg ? it.skip : it;
    t(`${s.id}: ${s.description}`, async () => {
      const parent = await mkdtemp(join(tmpdir(), "agent-tui-int-"));
      const { stdout } = await runScenario(s, parent, { liveLlm: false });
      for (const frag of s.expectStdout ?? []) {
        expect(stdout).toContain(frag);
      }
    });
  }
});
