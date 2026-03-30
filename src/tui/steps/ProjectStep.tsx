import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useWizardStore } from "../wizard-store.js";

export function ProjectStep() {
  const projectName = useWizardStore((s) => s.projectName);
  const setProjectName = useWizardStore((s) => s.setProjectName);
  const next = useWizardStore((s) => s.next);

  return (
    <Box flexDirection="column">
      <Text bold>Project directory name</Text>
      <Text dimColor>Letters, numbers, hyphens (e.g. my-agent)</Text>
      <TextInput
        value={projectName}
        onChange={setProjectName}
        onSubmit={() => next()}
      />
    </Box>
  );
}
