import type { PatternId } from "../patterns/registry.js";
import { getPattern, getTopologyForPattern } from "../patterns/registry.js";
import type { ScaffoldAnswers, ToolId } from "../schema.js";

export interface TemplateContext extends Record<string, unknown> {
  projectName: string;
  patternId: PatternId;
  patternLabel: string;
  patternDocUrl: string;
  topology: string;
  llm: ScaffoldAnswers["llm"];
  memory: string;
  planning: string;
  prompts: string;
  knowledge: string;
  vectorBackend: string;
  tools: string[];
  hasTool: (name: ToolId) => boolean;
  hasToolHttp: boolean;
  hasToolFilesystemRead: boolean;
  hasToolRunCommand: boolean;
  hasToolCustomStub: boolean;
  mcpServers: ScaffoldAnswers["mcpServers"];
  includeMcpServerSkeleton: boolean;
  useSqlDatabase: boolean;
  sqlBootstrap: string;
  sqliteFilePath: string;
  databaseUrlEnvVar: string;
}

const DOC_URL =
  "https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system";

export function buildTemplateContext(answers: ScaffoldAnswers): TemplateContext {
  const meta = getPattern(answers.patternId);
  const topology = getTopologyForPattern(answers.patternId);
  const tools = answers.tools ?? [];

  return {
    projectName: answers.projectName,
    patternId: answers.patternId,
    patternLabel: meta?.label ?? answers.patternId,
    patternDocUrl: DOC_URL,
    topology,
    llm: answers.llm,
    memory: answers.memory,
    planning: answers.planning,
    prompts: answers.prompts,
    knowledge: answers.knowledge,
    vectorBackend: answers.vectorBackend,
    tools,
    hasTool: (name: ToolId) => tools.includes(name),
    hasToolHttp: tools.includes("http"),
    hasToolFilesystemRead: tools.includes("filesystem_read"),
    hasToolRunCommand: tools.includes("run_command"),
    hasToolCustomStub: tools.includes("custom_stub"),
    mcpServers: answers.mcpServers,
    includeMcpServerSkeleton: answers.includeMcpServerSkeleton,
    useSqlDatabase: answers.useSqlDatabase,
    sqlBootstrap: answers.sqlBootstrap,
    sqliteFilePath: answers.sqliteFilePath,
    databaseUrlEnvVar: answers.databaseUrlEnvVar,
  };
}
