import type { ScaffoldAnswers } from "../src/schema.js";

export type IntegrationScenario = {
  id: string;
  description: string;
  answers: ScaffoldAnswers;
  /** Passed as AGENT_TUI_MOCK_SCENARIO */
  mockScenario?: string;
  runEnv?: Record<string, string>;
  expectStdout?: string[];
  sqlSmoke?: boolean;
  /** Skip in harness unless REDIS_URL (e.g. docker compose redis). */
  requiresRedis?: boolean;
  /**
   * After agent: assert Redis key `agent-tui:memory:<session>` has at least N messages.
   * Session from runEnv.AGENT_SESSION_ID ?? process.env.AGENT_SESSION_ID ?? "default".
   * Uses process.env.REDIS_URL.
   */
  assertRedisMemoryMinMessages?: number;
  /**
   * Needs DATABASE_URL (Postgres + pgvector) and OPENAI_API_KEY to seed embeddings + assert `retrieveContext`.
   */
  requiresPostgresPgvector?: boolean;
  /** After npm run build in mcp-servers/custom */
  assertMcpServerBuilt?: boolean;
};
