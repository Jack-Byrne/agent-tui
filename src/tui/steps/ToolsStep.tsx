import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";
import type { ToolId } from "../../schema.js";

const ALL: ToolId[] = ["http", "filesystem_read", "run_command", "custom_stub"];

export function ToolsStep() {
  const tools = useWizardStore((s) => s.tools);
  const toggleTool = useWizardStore((s) => s.toggleTool);
  const next = useWizardStore((s) => s.next);

  const items = [
    ...ALL.map((id) => ({
      label: `${tools.has(id) ? "[x]" : "[ ]"} ${id}`,
      value: id,
    })),
    { label: "Continue →", value: "__done__" as const },
  ];

  return (
    <Box flexDirection="column">
      <Text bold>Tools (toggle with Enter)</Text>
      <Text dimColor>Only registered tools are exposed to the model.</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
          if (item.value === "__done__") {
            next();
            return;
          }
          toggleTool(item.value as ToolId);
        }}
      />
    </Box>
  );
}
