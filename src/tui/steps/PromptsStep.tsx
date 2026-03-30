import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";
import type { PromptPack } from "../../schema.js";

export function PromptsStep() {
  const prompts = useWizardStore((s) => s.prompts);
  const setPrompts = useWizardStore((s) => s.setPrompts);
  const next = useWizardStore((s) => s.next);

  const items = (["minimal", "production"] as PromptPack[]).map((p) => ({
    label: p === prompts ? `* ${p}` : p,
    value: p,
  }));

  return (
    <Box flexDirection="column">
      <Text bold>Prompt pack</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
          setPrompts(item.value as PromptPack);
          next();
        }}
      />
    </Box>
  );
}
