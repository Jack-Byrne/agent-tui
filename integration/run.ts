import { integrationScenarios, quickScenarios } from "./scenarios.js";
import { defaultIntegrationParentDir, runScenario } from "./run-scenario.js";

async function main() {
  const live = process.env.AGENT_TUI_LIVE_LLM === "1";
  const quick = process.env.INTEGRATION_QUICK === "1";
  const only = process.argv[2];
  let list = quick ? quickScenarios() : integrationScenarios;
  if (only) list = list.filter((s) => s.id === only);

  const parent = defaultIntegrationParentDir();

  for (const s of list) {
    const needsRedis =
      s.requiresRedis ||
      (s.assertRedisMemoryMinMessages != null && s.assertRedisMemoryMinMessages > 0);
    if (needsRedis && !process.env.REDIS_URL) {
      console.warn("skip (no REDIS_URL):", s.id);
      continue;
    }
    if (
      s.requiresPostgresPgvector &&
      (!process.env.DATABASE_URL || !process.env.OPENAI_API_KEY)
    ) {
      console.warn("skip (no DATABASE_URL / OPENAI_API_KEY):", s.id);
      continue;
    }
    console.log(live ? "live →" : "mock →", s.id);
    await runScenario(s, parent, { liveLlm: live });
    console.log("ok", s.id);
  }
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
