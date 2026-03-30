import { create } from "zustand";
import type { PatternId } from "../patterns/registry.js";
import type {
  KnowledgeKind,
  LlmProvider,
  MemoryKind,
  McpServerConfig,
  PlanningKind,
  PromptPack,
  ScaffoldAnswers,
  SqlBootstrap,
  ToolId,
  VectorBackend,
} from "../schema.js";
import {
  defaultApiKeyEnv,
  defaultModelForProvider,
  scaffoldAnswersSchema,
} from "../schema.js";

export type WizardStep =
  | "project"
  | "pattern"
  | "llm"
  | "memory"
  | "planning"
  | "prompts"
  | "knowledge"
  | "tools"
  | "mcp"
  | "database"
  | "claude"
  | "summary";

const STEP_ORDER: WizardStep[] = [
  "project",
  "pattern",
  "llm",
  "memory",
  "planning",
  "prompts",
  "knowledge",
  "tools",
  "mcp",
  "database",
  "claude",
  "summary",
];

export interface WizardState {
  stepIndex: number;
  projectName: string;
  patternId: PatternId | null;
  llmProvider: LlmProvider;
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;
  llmBaseUrl: string;
  memory: MemoryKind;
  planning: PlanningKind;
  prompts: PromptPack;
  knowledge: KnowledgeKind;
  vectorBackend: VectorBackend;
  tools: Set<ToolId>;
  mcpServers: McpServerConfig[];
  includeMcpServerSkeleton: boolean;
  useSqlDatabase: boolean;
  sqlBootstrap: SqlBootstrap;
  sqliteFilePath: string;
  databaseUrlEnvVar: string;
  generateClaudeHandoff: boolean;
  tryClaudeSpawn: boolean;
  error: string | null;

  setStepIndex: (i: number) => void;
  next: () => void;
  back: () => void;
  setProjectName: (v: string) => void;
  setPatternId: (v: PatternId) => void;
  setLlmProvider: (v: LlmProvider) => void;
  setLlmModel: (v: string) => void;
  setLlmTemperature: (v: number) => void;
  setLlmMaxTokens: (v: number) => void;
  setLlmBaseUrl: (v: string) => void;
  setMemory: (v: MemoryKind) => void;
  setPlanning: (v: PlanningKind) => void;
  setPrompts: (v: PromptPack) => void;
  setKnowledge: (v: KnowledgeKind) => void;
  setVectorBackend: (v: VectorBackend) => void;
  toggleTool: (t: ToolId) => void;
  setMcpServers: (v: McpServerConfig[]) => void;
  setIncludeMcpSkeleton: (v: boolean) => void;
  setUseSqlDatabase: (v: boolean) => void;
  setSqlBootstrap: (v: SqlBootstrap) => void;
  setSqliteFilePath: (v: string) => void;
  setDatabaseUrlEnvVar: (v: string) => void;
  setGenerateClaudeHandoff: (v: boolean) => void;
  setTryClaudeSpawn: (v: boolean) => void;
  setError: (v: string | null) => void;
  toAnswers: (outputDir: string) => ScaffoldAnswers;
}

function clampStepIndex(i: number): number {
  if (i < 0) return 0;
  if (i >= STEP_ORDER.length) return STEP_ORDER.length - 1;
  return i;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  stepIndex: 0,
  projectName: "my-agent",
  patternId: null,
  llmProvider: "openai",
  llmModel: defaultModelForProvider("openai"),
  llmTemperature: 0.2,
  llmMaxTokens: 4096,
  llmBaseUrl: "",
  memory: "conversation",
  planning: "react_loop",
  prompts: "minimal",
  knowledge: "none",
  vectorBackend: "stub",
  tools: new Set<ToolId>(),
  mcpServers: [],
  includeMcpServerSkeleton: false,
  useSqlDatabase: false,
  sqlBootstrap: "connection_url",
  sqliteFilePath: "data/local.db",
  databaseUrlEnvVar: "DATABASE_URL",
  generateClaudeHandoff: true,
  tryClaudeSpawn: false,
  error: null,

  setStepIndex: (i) => set({ stepIndex: clampStepIndex(i) }),
  next: () => set((s) => ({ stepIndex: clampStepIndex(s.stepIndex + 1) })),
  back: () => set((s) => ({ stepIndex: clampStepIndex(s.stepIndex - 1) })),

  setProjectName: (v) => set({ projectName: v }),
  setPatternId: (v) =>
    set({
      patternId: v,
      llmModel: defaultModelForProvider(get().llmProvider),
    }),
  setLlmProvider: (v) =>
    set({
      llmProvider: v,
      llmModel: defaultModelForProvider(v),
    }),
  setLlmModel: (v) => set({ llmModel: v }),
  setLlmTemperature: (v) => set({ llmTemperature: v }),
  setLlmMaxTokens: (v) => set({ llmMaxTokens: v }),
  setLlmBaseUrl: (v) => set({ llmBaseUrl: v }),
  setMemory: (v) => set({ memory: v }),
  setPlanning: (v) => set({ planning: v }),
  setPrompts: (v) => set({ prompts: v }),
  setKnowledge: (v) =>
    set((s) => ({
      knowledge: v,
      vectorBackend: v === "vector_db" ? s.vectorBackend : "none",
    })),
  setVectorBackend: (v) => set({ vectorBackend: v }),
  toggleTool: (t) =>
    set((s) => {
      const next = new Set(s.tools);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return { tools: next };
    }),
  setMcpServers: (v) => set({ mcpServers: v }),
  setIncludeMcpSkeleton: (v) => set({ includeMcpServerSkeleton: v }),
  setUseSqlDatabase: (v) => set({ useSqlDatabase: v }),
  setSqlBootstrap: (v) => set({ sqlBootstrap: v }),
  setSqliteFilePath: (v) => set({ sqliteFilePath: v }),
  setDatabaseUrlEnvVar: (v) => set({ databaseUrlEnvVar: v }),
  setGenerateClaudeHandoff: (v) => set({ generateClaudeHandoff: v }),
  setTryClaudeSpawn: (v) => set({ tryClaudeSpawn: v }),
  setError: (v) => set({ error: v }),

  toAnswers: (outputDir: string) => {
    const s = get();
    if (!s.patternId) throw new Error("patternId required");

    const base = {
      projectName: s.projectName,
      patternId: s.patternId,
      llm: {
        provider: s.llmProvider,
        model: s.llmModel,
        temperature: s.llmTemperature,
        maxTokens: s.llmMaxTokens,
        baseUrl: s.llmBaseUrl.trim() ? s.llmBaseUrl.trim() : undefined,
        apiKeyEnvVar: defaultApiKeyEnv(s.llmProvider),
      },
      memory: s.memory,
      planning: s.planning,
      prompts: s.prompts,
      knowledge: s.knowledge,
      vectorBackend:
        s.knowledge === "vector_db" ? s.vectorBackend : ("none" as const),
      tools: Array.from(s.tools),
      mcpServers: s.mcpServers,
      includeMcpServerSkeleton: s.includeMcpServerSkeleton,
      databaseUrlEnvVar: s.databaseUrlEnvVar,
      useSqlDatabase: s.useSqlDatabase,
      sqlBootstrap: s.sqlBootstrap,
      sqliteFilePath: s.sqliteFilePath,
      generateClaudeHandoff: s.generateClaudeHandoff,
      tryClaudeSpawn: s.tryClaudeSpawn,
    };

    const parsed = scaffoldAnswersSchema.safeParse(base);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }
    void outputDir;
    return parsed.data;
  },
}));

export function currentStep(state: WizardState): WizardStep {
  return STEP_ORDER[state.stepIndex] ?? "summary";
}

/** Reset wizard state when re-entering Create from the main menu. */
export function resetWizard(): void {
  useWizardStore.setState({
    stepIndex: 0,
    projectName: "my-agent",
    patternId: null,
    llmProvider: "openai",
    llmModel: defaultModelForProvider("openai"),
    llmTemperature: 0.2,
    llmMaxTokens: 4096,
    llmBaseUrl: "",
    memory: "conversation",
    planning: "react_loop",
    prompts: "minimal",
    knowledge: "none",
    vectorBackend: "stub",
    tools: new Set<ToolId>(),
    mcpServers: [],
    includeMcpServerSkeleton: false,
    useSqlDatabase: false,
    sqlBootstrap: "connection_url",
    sqliteFilePath: "data/local.db",
    databaseUrlEnvVar: "DATABASE_URL",
    generateClaudeHandoff: true,
    tryClaudeSpawn: false,
    error: null,
  });
}

export { STEP_ORDER };
