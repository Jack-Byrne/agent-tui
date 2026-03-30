import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";
import type { PlanningKind } from "../../schema.js";

export function PlanningStep() {
  const planning = useWizardStore((s) => s.planning);
  const setPlanning = useWizardStore((s) => s.setPlanning);
  const next = useWizardStore((s) => s.next);

  const items = (
    [
      "none",
      "react_loop",
      "planner_executor_stub",
    ] as PlanningKind[]
  ).map((p) => ({
    label: p === planning ? `* ${p}` : p,
    value: p,
  }));

  return (
    <Box flexDirection="column">
      <Text bold>Planning mode</Text>
      <Text dimColor>Documented in scaffold; extend agents for real planners.</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
          setPlanning(item.value as PlanningKind);
          next();
        }}
      />
    </Box>
  );
}
