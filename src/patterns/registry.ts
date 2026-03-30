/**
 * Design patterns aligned with Google Cloud guidance:
 * https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system
 */

export type PatternId =
  | "single_agent"
  | "react"
  | "sequential"
  | "parallel"
  | "loop"
  | "review_critique"
  | "iterative_refinement"
  | "coordinator"
  | "hierarchical"
  | "swarm"
  | "human_in_the_loop"
  | "custom_logic";

export interface PatternMeta {
  id: PatternId;
  label: string;
  shortDescription: string;
  tradeoff: string;
  /** Template subdirectory / topology hint */
  topology: "single" | "multi_sequential" | "multi_parallel" | "multi_coordinator" | "react" | "hitl" | "custom";
}

export const PATTERNS: readonly PatternMeta[] = [
  {
    id: "single_agent",
    label: "Single agent",
    shortDescription: "One model, tools, and system prompt handle the full task.",
    tradeoff: "Simpler; weaker when many distinct skills compete in one prompt.",
    topology: "single",
  },
  {
    id: "react",
    label: "ReAct",
    shortDescription: "Thought → action → observation loop until exit.",
    tradeoff: "Adaptive; more steps and latency than a single completion.",
    topology: "react",
  },
  {
    id: "sequential",
    label: "Multi-agent sequential",
    shortDescription: "Fixed pipeline: each agent consumes the previous output.",
    tradeoff: "Low orchestration cost; rigid order, hard to skip steps.",
    topology: "multi_sequential",
  },
  {
    id: "parallel",
    label: "Multi-agent parallel",
    shortDescription: "Sub-agents run concurrently; results are merged.",
    tradeoff: "Lower latency fan-out; higher cost and merge complexity.",
    topology: "multi_parallel",
  },
  {
    id: "loop",
    label: "Multi-agent loop",
    shortDescription: "Repeat sub-agents until a termination condition.",
    tradeoff: "Good for refinement; needs strict exit guards.",
    topology: "multi_sequential",
  },
  {
    id: "review_critique",
    label: "Review & critique",
    shortDescription: "Generator then critic; can loop for revisions.",
    tradeoff: "Higher quality checks; extra model calls.",
    topology: "multi_sequential",
  },
  {
    id: "iterative_refinement",
    label: "Iterative refinement",
    shortDescription: "Progressively improve state until threshold or max iterations.",
    tradeoff: "Strong polish; cost scales with iterations.",
    topology: "multi_sequential",
  },
  {
    id: "coordinator",
    label: "Coordinator",
    shortDescription: "Router decomposes work and dispatches specialized agents.",
    tradeoff: "Flexible routing; multiple model calls and higher latency.",
    topology: "multi_coordinator",
  },
  {
    id: "hierarchical",
    label: "Hierarchical decomposition",
    shortDescription: "Nested coordinators decompose until leaf workers execute.",
    tradeoff: "Best for ambiguous plans; most complex and expensive.",
    topology: "multi_coordinator",
  },
  {
    id: "swarm",
    label: "Swarm",
    shortDescription: "Collaborative agents with all-to-all style iteration.",
    tradeoff: "Rich debate; hardest to converge and cost-control.",
    topology: "multi_parallel",
  },
  {
    id: "human_in_the_loop",
    label: "Human-in-the-loop",
    shortDescription: "Pause for approval or input at checkpoints.",
    tradeoff: "Safer for high-stakes flows; needs external human channel.",
    topology: "hitl",
  },
  {
    id: "custom_logic",
    label: "Custom logic",
    shortDescription: "Code-first branches mixing patterns (refunds-style example).",
    tradeoff: "Maximum control; you own orchestration correctness.",
    topology: "custom",
  },
] as const;

export function getPattern(id: PatternId): PatternMeta | undefined {
  return PATTERNS.find((p) => p.id === id);
}

export function getTopologyForPattern(id: PatternId): PatternMeta["topology"] {
  return getPattern(id)?.topology ?? "single";
}
