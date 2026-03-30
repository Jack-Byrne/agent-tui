import fs from "fs-extra";
import { join } from "pathe";
import type { ScaffoldAnswers } from "../schema.js";

function toCursorMcp(answers: ScaffoldAnswers): Record<string, unknown> {
  const servers: Record<string, unknown> = {};
  for (const s of answers.mcpServers) {
    servers[s.name] = {
      command: s.command,
      args: s.args ?? [],
      ...(s.env ? { env: s.env } : {}),
    };
  }
  if (Object.keys(servers).length === 0) {
    servers["everything"] = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-everything"],
    };
  }
  return { mcpServers: servers };
}

export async function writeMcpExample(
  projectDir: string,
  answers: ScaffoldAnswers,
): Promise<void> {
  const path = join(projectDir, "config", "mcp.example.json");
  await fs.mkdir(join(projectDir, "config"), { recursive: true });
  await fs.writeJSON(path, toCursorMcp(answers), { spaces: 2 });
}
