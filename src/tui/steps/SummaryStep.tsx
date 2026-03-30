import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";
import { getPattern } from "../../patterns/registry.js";

interface Props {
  onGenerate: () => void;
}

export function SummaryStep({ onGenerate }: Props) {
  const state = useWizardStore();
  const back = useWizardStore((s) => s.back);
  const pattern = state.patternId ? getPattern(state.patternId) : undefined;

  if (!state.patternId) {
    return <Text>No pattern selected. Press back.</Text>;
  }

  const answers = () => {
    try {
      return state.toAnswers(".");
    } catch (e) {
      return null;
    }
  };

  const a = answers();

  return (
    <Box flexDirection="column">
      <Text bold>Summary</Text>
      <Text>
        Project: {state.projectName} | Pattern: {pattern?.label} ({state.patternId})
      </Text>
      <Text>
        LLM: {state.llmProvider} / {state.llmModel} (T={state.llmTemperature}, max={state.llmMaxTokens})
      </Text>
      <Text>
        Memory: {state.memory} | Planning: {state.planning} | Prompts: {state.prompts}
      </Text>
      <Text>
        Knowledge: {state.knowledge} | Vector: {state.vectorBackend} | SQL:{" "}
        {state.useSqlDatabase
          ? `yes (${state.sqlBootstrap}${state.sqlBootstrap === "sqlite_file" ? ` @ ${state.sqliteFilePath}` : ""})`
          : "no"}
      </Text>
      <Text>Tools: {Array.from(state.tools).join(", ") || "(none)"}</Text>
      <Text>MCP skeleton: {state.includeMcpServerSkeleton ? "yes" : "no"}</Text>
      {!a ? <Text color="red">Invalid answers — check project name pattern.</Text> : null}
      <Box marginTop={1}>
        <SelectInput
          items={[
            { label: "← Back", value: "back" },
            { label: "Generate project", value: "go" },
          ]}
          onSelect={(item) => {
            if (item.value === "back") back();
            else if (a) onGenerate();
          }}
        />
      </Box>
    </Box>
  );
}
