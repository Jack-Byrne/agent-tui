import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";
import type { MemoryKind } from "../../schema.js";

export function MemoryStep() {
  const memory = useWizardStore((s) => s.memory);
  const setMemory = useWizardStore((s) => s.setMemory);
  const next = useWizardStore((s) => s.next);

  const items = (
    [
      "none",
      "conversation",
      "file",
      "redis",
      "db",
    ] as MemoryKind[]
  ).map((m) => ({
    label: m === memory ? `* ${m}` : m,
    value: m,
  }));

  return (
    <Box flexDirection="column">
      <Text bold>Memory backend</Text>
      <Text dimColor>Scaffold emits stubs; wire your store in src/memory/</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
          setMemory(item.value as MemoryKind);
          next();
        }}
      />
    </Box>
  );
}
