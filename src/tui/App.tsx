import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { useWizardStore, STEP_ORDER } from "./wizard-store.js";
import { ProjectStep } from "./steps/ProjectStep.js";
import { PatternStep } from "./steps/PatternStep.js";
import { LlmStep } from "./steps/LlmStep.js";
import { MemoryStep } from "./steps/MemoryStep.js";
import { PlanningStep } from "./steps/PlanningStep.js";
import { PromptsStep } from "./steps/PromptsStep.js";
import { KnowledgeStep } from "./steps/KnowledgeStep.js";
import { ToolsStep } from "./steps/ToolsStep.js";
import { McpStep } from "./steps/McpStep.js";
import { DatabaseStep } from "./steps/DatabaseStep.js";
import { ClaudeStep } from "./steps/ClaudeStep.js";
import { SummaryStep } from "./steps/SummaryStep.js";
import type { ScaffoldAnswers } from "../schema.js";

interface Props {
  outputDir: string;
  onDone: (result: {
    answers: ScaffoldAnswers;
    outputDir: string;
    claudeStdout?: string;
    claudeNote?: string;
  }) => void;
}

export function App({ outputDir, onDone }: Props) {
  const stepIndex = useWizardStore((s) => s.stepIndex);
  const back = useWizardStore((s) => s.back);
  const step = STEP_ORDER[stepIndex] ?? "summary";

  useInput((input, key) => {
    if (key.escape) {
      process.exit(0);
    }
    if (input === "b" && step !== "project") {
      back();
    }
  });

  const handleGenerate = async () => {
    const s = useWizardStore.getState();
    const answers = s.toAnswers(outputDir);
    const { generateProject } = await import("../generate/writer.js");
    const result = await generateProject(outputDir, answers);
    onDone({
      answers,
      outputDir: result.outputDir,
      claudeStdout: result.claudeSpawnStdout,
      claudeNote: result.claudeSpawnNote,
    });
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text dimColor>
        Step {stepIndex + 1}/{STEP_ORDER.length} — [{step}] — press &apos;b&apos; back, Esc exit
      </Text>
      <Box marginY={1}>
        {step === "project" ? <ProjectStep /> : null}
        {step === "pattern" ? <PatternStep /> : null}
        {step === "llm" ? <LlmStep /> : null}
        {step === "memory" ? <MemoryStep /> : null}
        {step === "planning" ? <PlanningStep /> : null}
        {step === "prompts" ? <PromptsStep /> : null}
        {step === "knowledge" ? <KnowledgeStep /> : null}
        {step === "tools" ? <ToolsStep /> : null}
        {step === "mcp" ? <McpStep /> : null}
        {step === "database" ? <DatabaseStep /> : null}
        {step === "claude" ? <ClaudeStep /> : null}
        {step === "summary" ? (
          <SummaryStep onGenerate={() => void handleGenerate()} />
        ) : null}
      </Box>
    </Box>
  );
}
