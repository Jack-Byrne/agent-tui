import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart,
} from "ai";

type V1FunctionTool = {
  type: "function";
  name: string;
  description?: string;
  parameters: unknown;
};

type V1FunctionToolCall = {
  toolCallType: "function";
  toolCallId: string;
  toolName: string;
  args: string;
};

const callCounts = new Map<string, number>();

function scenarioKey(): string {
  return process.env.AGENT_TUI_MOCK_SCENARIO ?? "default";
}

function nextCallIndex(): number {
  const k = scenarioKey();
  const n = (callCounts.get(k) ?? 0) + 1;
  callCounts.set(k, n);
  return n;
}

/** Reset between runners if needed */
export function resetMockLlmCallCounts(): void {
  callCounts.clear();
}

function functionTools(options: LanguageModelV1CallOptions): V1FunctionTool[] {
  if (options.mode.type !== "regular") return [];
  const tools = options.mode.tools;
  if (!tools) return [];
  return tools.filter((t): t is V1FunctionTool => t.type === "function");
}

function mockArgsForTool(name: string): Record<string, unknown> {
  switch (name) {
    case "http_fetch":
      return { url: "https://example.com" };
    case "filesystem_read":
      return { path: "package.json" };
    case "run_command":
      return { cmd: "echo", args: ["agent-tui-mock"] };
    case "custom_stub":
      return { input: "mock" };
    default:
      return {};
  }
}

function isCoordinatorClassify(options: LanguageModelV1CallOptions): boolean {
  return options.maxTokens === 32 && options.temperature === 0;
}

function buildResult(options: LanguageModelV1CallOptions): {
  text?: string;
  toolCalls?: V1FunctionToolCall[];
  finishReason: "stop" | "length" | "tool-calls" | "error" | "other" | "unknown";
  usage: { promptTokens: number; completionTokens: number };
  rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
} {
  const usage = { promptTokens: 1, completionTokens: 1 };
  const rawCall = { rawPrompt: null, rawSettings: {} };

  if (isCoordinatorClassify(options)) {
    const route = process.env.AGENT_TUI_MOCK_COORDINATOR_ROUTE ?? "search";
    return {
      finishReason: "stop",
      text: route,
      usage,
      rawCall,
    };
  }

  const scenario = scenarioKey();
  const n = nextCallIndex();
  const tools = functionTools(options);

  if (scenario === "planner_stub" && n === 1) {
    return {
      finishReason: "stop",
      text: "1. Analyze\n2. Respond briefly",
      usage,
      rawCall,
    };
  }

  if (scenario === "tool_roundtrip" && tools.length > 0 && n === 1) {
    const t = tools[0];
    return {
      finishReason: "tool-calls",
      toolCalls: [
        {
          toolCallType: "function",
          toolCallId: "mock-tool-1",
          toolName: t.name,
          args: JSON.stringify(mockArgsForTool(t.name)),
        },
      ],
      usage,
      rawCall,
    };
  }

  if (scenario === "tool_roundtrip" && n > 1) {
    return {
      finishReason: "stop",
      text: "MOCK_TOOL_DONE",
      usage,
      rawCall,
    };
  }

  if (scenario === "planner_stub" && n > 1) {
    return {
      finishReason: "stop",
      text: process.env.AGENT_TUI_MOCK_TEXT ?? "MOCK_PLAN_EXECUTED",
      usage,
      rawCall,
    };
  }

  if (scenario === "default" || !scenario) {
    return {
      finishReason: "stop",
      text: process.env.AGENT_TUI_MOCK_TEXT ?? "MOCK_OK",
      usage,
      rawCall,
    };
  }

  return {
    finishReason: "stop",
    text: process.env.AGENT_TUI_MOCK_TEXT ?? `MOCK_${scenario}_${n}`,
    usage,
    rawCall,
  };
}

export function createMockLanguageModelIfEnabled(): LanguageModelV1 | null {
  if (process.env.AGENT_TUI_MOCK_LLM !== "1") return null;

  const model: LanguageModelV1 = {
    specificationVersion: "v1",
    provider: "agent-tui-mock",
    modelId: "mock",
    defaultObjectGenerationMode: "tool",
    async doGenerate(options) {
      const r = buildResult(options);
      if (r.toolCalls?.length) {
        return {
          finishReason: "tool-calls",
          toolCalls: r.toolCalls,
          usage: r.usage,
          rawCall: r.rawCall,
        };
      }
      return {
        finishReason: r.finishReason,
        text: r.text,
        usage: r.usage,
        rawCall: r.rawCall,
      };
    },
    async doStream(options) {
      const r = buildResult(options);
      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          if (r.toolCalls?.length) {
            for (const tc of r.toolCalls) {
              controller.enqueue({ type: "tool-call", ...tc });
            }
          }
          if (r.text) {
            controller.enqueue({ type: "text-delta", textDelta: r.text });
          }
          controller.enqueue({
            type: "finish",
            finishReason: r.finishReason,
            usage: r.usage,
          });
          controller.close();
        },
      });
      return { stream, rawCall: r.rawCall };
    },
  };

  return model;
}
