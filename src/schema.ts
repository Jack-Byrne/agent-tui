import { z } from "zod";
import type { PatternId } from "./patterns/registry.js";
import { PATTERNS } from "./patterns/registry.js";

const patternIds = PATTERNS.map((p) => p.id) as [PatternId, ...PatternId[]];

export const llmProviderSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "azure_openai",
  "ollama",
]);

export type LlmProvider = z.infer<typeof llmProviderSchema>;

export const memoryKindSchema = z.enum([
  "none",
  "conversation",
  "file",
  "redis",
  "db",
]);

export const planningKindSchema = z.enum([
  "none",
  "react_loop",
  "planner_executor_stub",
]);

export const promptPackSchema = z.enum(["minimal", "production"]);

export const knowledgeKindSchema = z.enum([
  "none",
  "filesystem_rag_stub",
  "vector_db",
]);

export const toolIdSchema = z.enum([
  "http",
  "filesystem_read",
  "run_command",
  "custom_stub",
]);

export const vectorBackendSchema = z.enum([
  "none",
  "pgvector",
  "stub",
]);

/** How to get a DB when SQL + Drizzle are enabled (see Database step in TUI). */
export const sqlBootstrapSchema = z.enum([
  /** User supplies DATABASE_URL (e.g. existing Postgres). */
  "connection_url",
  /** Generate docker-compose.yml + default local Postgres URL. */
  "docker_postgres",
  /** File-based SQLite; no Postgres or URL required to start. */
  "sqlite_file",
]);

export type SqlBootstrap = z.infer<typeof sqlBootstrapSchema>;

export const mcpServerConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).optional(),
});

export const scaffoldAnswersSchema = z.object({
  projectName: z.string().min(1).regex(/^[a-z0-9-]+$/i, "Use letters, numbers, hyphens"),
  patternId: z.enum(patternIds),
  llm: z.object({
    provider: llmProviderSchema,
    model: z.string().min(1),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().positive().max(200000),
    baseUrl: z.string().optional(),
    /** Env var name for API key (informational; set in .env by user) */
    apiKeyEnvVar: z.string().min(1),
  }),
  memory: memoryKindSchema,
  planning: planningKindSchema,
  prompts: promptPackSchema,
  knowledge: knowledgeKindSchema,
  vectorBackend: vectorBackendSchema,
  tools: z.array(toolIdSchema).default([]),
  mcpServers: z.array(mcpServerConfigSchema).default([]),
  includeMcpServerSkeleton: z.boolean().default(false),
  databaseUrlEnvVar: z.string().default("DATABASE_URL"),
  /** Whether generated app expects DATABASE_URL in .env */
  useSqlDatabase: z.boolean().default(false),
  /** When useSqlDatabase: how the project gets a database (Docker / SQLite / bring URL). */
  sqlBootstrap: sqlBootstrapSchema.default("connection_url"),
  /** Default SQLite file path when sqlBootstrap is sqlite_file (also overrides via SQLITE_PATH). */
  sqliteFilePath: z.string().min(1).default("data/local.db"),
  generateClaudeHandoff: z.boolean().default(true),
  tryClaudeSpawn: z.boolean().default(false),
});

export type ScaffoldAnswers = z.infer<typeof scaffoldAnswersSchema>;
export type McpServerConfig = z.infer<typeof mcpServerConfigSchema>;
export type MemoryKind = z.infer<typeof memoryKindSchema>;
export type PlanningKind = z.infer<typeof planningKindSchema>;
export type PromptPack = z.infer<typeof promptPackSchema>;
export type KnowledgeKind = z.infer<typeof knowledgeKindSchema>;
export type ToolId = z.infer<typeof toolIdSchema>;
export type VectorBackend = z.infer<typeof vectorBackendSchema>;

export function defaultApiKeyEnv(provider: LlmProvider): string {
  switch (provider) {
    case "openai":
      return "OPENAI_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "google":
      return "GOOGLE_GENERATIVE_AI_API_KEY";
    case "azure_openai":
      return "AZURE_OPENAI_API_KEY";
    case "ollama":
      return "OLLAMA_BASE_URL";
    default:
      return "LLM_API_KEY";
  }
}

export function defaultModelForProvider(provider: LlmProvider): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      // Stable API id (see https://docs.anthropic.com/en/docs/about-claude/models/overview )
      return "claude-sonnet-4-6";
    case "google":
      return "gemini-1.5-flash";
    case "azure_openai":
      return "gpt-4o";
    case "ollama":
      return "llama3.2";
    default:
      return "gpt-4o-mini";
  }
}
