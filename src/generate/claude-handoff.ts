import fs from "fs-extra";
import { join } from "pathe";
import type { ScaffoldAnswers } from "../schema.js";
import { getPattern } from "../patterns/registry.js";

export async function writeClaudeHandoff(
  projectDir: string,
  answers: ScaffoldAnswers,
): Promise<void> {
  const meta = getPattern(answers.patternId);
  const lines: string[] = [
    "# Claude Code handoff",
    "",
    "Use this document with Anthropic Claude Code when you want help finishing boilerplate that is awkward in a terminal-only flow.",
    "",
    "## Project",
    "",
    `- **Name**: ${answers.projectName}`,
    `- **Pattern**: ${meta?.label ?? answers.patternId} (${answers.patternId})`,
    `- **Guide**: https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system`,
    "",
    "## Generated layout",
    "",
    "- `src/agents/` — agent orchestration stubs",
    "- `src/tools/` — tool registrations",
    "- `src/memory/` — memory backends",
    "- `src/prompts/` — system / instruction prompts",
    "- `src/knowledge/` — RAG / vector hooks",
    "- `src/llm/` — provider wiring (Vercel AI SDK)",
    "- `config/` — optional app config",
    "",
    "## Suggested Claude Code tasks",
    "",
    "1. Implement real tool behaviors under `src/tools/` (HTTP, safe file reads, etc.).",
    "2. Flesh out MCP server process(es) if using MCP; verify Cursor/Claude MCP config paths.",
    "3. Add database migrations if `DATABASE_URL` / Drizzle is enabled.",
    "4. Tune prompts in `src/prompts/` for your safety and formatting requirements.",
    "",
    "## MCP intents from scaffold",
    "",
    answers.mcpServers.length
      ? "```json\n" + JSON.stringify(answers.mcpServers, null, 2) + "\n```"
      : "_No MCP servers were captured in the wizard; add them to `agent.scaffold.json`._",
    "",
    "## Non-interactive CLI hint",
    "",
    "If `claude` is installed, you can try:",
    "",
    "```bash",
    'claude -p "Read claude-handoff.md and implement the suggested tasks for this repo."',
    "```",
    "",
    "Note: spawning `claude` from some Node versions has had upstream issues; if automation fails, run the command manually in this directory.",
    "",
  ];

  await fs.writeFile(join(projectDir, "claude-handoff.md"), lines.join("\n"), "utf8");
}
