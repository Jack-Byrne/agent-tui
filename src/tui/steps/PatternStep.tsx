import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { PatternId } from "../../patterns/registry.js";
import { PATTERNS } from "../../patterns/registry.js";
import { useWizardStore } from "../wizard-store.js";

export function PatternStep() {
  const setPatternId = useWizardStore((s) => s.setPatternId);
  const next = useWizardStore((s) => s.next);

  const items = PATTERNS.map((p) => ({
    label: `${p.label} — ${p.tradeoff}`,
    value: p.id,
  }));

  return (
    <Box flexDirection="column">
      <Text bold>Agent design pattern</Text>
      <Text dimColor>Google Cloud agentic AI patterns</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
          setPatternId(item.value as PatternId);
          next();
        }}
      />
    </Box>
  );
}
