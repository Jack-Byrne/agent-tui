import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";

export function ClaudeStep() {
  const gen = useWizardStore((s) => s.generateClaudeHandoff);
  const trySpawn = useWizardStore((s) => s.tryClaudeSpawn);
  const setGen = useWizardStore((s) => s.setGenerateClaudeHandoff);
  const setTry = useWizardStore((s) => s.setTryClaudeSpawn);
  const next = useWizardStore((s) => s.next);

  const items = [
    {
      label: `${gen ? "[x]" : "[ ]"} Write claude-handoff.md`,
      value: "handoff" as const,
    },
    {
      label: `${trySpawn ? "[x]" : "[ ]"} Try \`claude -p\` after generate (best-effort)`,
      value: "spawn" as const,
    },
    { label: "Continue →", value: "done" as const },
  ];

  return (
    <Box flexDirection="column">
      <Text bold>Claude Code</Text>
      <Text dimColor>Fallback for complex boilerplate; spawning from Node can be flaky.</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
          if (item.value === "handoff") {
            setGen(!gen);
            return;
          }
          if (item.value === "spawn") {
            setTry(!trySpawn);
            return;
          }
          next();
        }}
      />
    </Box>
  );
}
