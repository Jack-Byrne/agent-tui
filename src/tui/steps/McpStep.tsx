import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";

export function McpStep() {
  const include = useWizardStore((s) => s.includeMcpServerSkeleton);
  const setInclude = useWizardStore((s) => s.setIncludeMcpSkeleton);
  const setMcpServers = useWizardStore((s) => s.setMcpServers);
  const next = useWizardStore((s) => s.next);

  const items = [
    {
      label: `${include ? "[x]" : "[ ]"} Generate Node MCP server skeleton (mcp-servers/custom)`,
      value: "toggle" as const,
    },
    {
      label: "Use preset MCP server list (everything demo) in manifest",
      value: "preset" as const,
    },
    { label: "Continue →", value: "done" as const },
  ];

  return (
    <Box flexDirection="column">
      <Text bold>MCP</Text>
      <Text dimColor>config/mcp.example.json is always written from your choices.</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
          if (item.value === "toggle") {
            setInclude(!include);
            return;
          }
          if (item.value === "preset") {
            setMcpServers([
              {
                name: "everything",
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-everything"],
              },
            ]);
            return;
          }
          next();
        }}
      />
    </Box>
  );
}
