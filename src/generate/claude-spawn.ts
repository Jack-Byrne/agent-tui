import { spawn } from "node:child_process";
import type { ScaffoldAnswers } from "../schema.js";

export interface SpawnClaudeResult {
  ok: boolean;
  stdout: string;
  note?: string;
}

/**
 * Best-effort non-interactive Claude Code invocation.
 * Degrades gracefully — many users will run `claude` manually.
 */
export async function spawnClaudeOptional(
  projectDir: string,
  _answers: ScaffoldAnswers,
): Promise<SpawnClaudeResult> {
  void _answers;
  const prompt =
    "You are helping complete a freshly scaffolded agent project. Read claude-handoff.md and agent.scaffold.json, then propose minimal code edits (list files only in your first reply). Keep changes small and safe.";

  return await new Promise((resolve) => {
    const child = spawn(
      "claude",
      ["-p", prompt],
      {
        cwd: projectDir,
        env: process.env,
        shell: false,
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (c) => {
      stdout += String(c);
    });
    child.stderr?.on("data", (c) => {
      stderr += String(c);
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      resolve({
        ok: false,
        stdout: "",
        note: `Could not spawn claude: ${err.message}. Run manually from ${projectDir}.`,
      });
    });

    child.on("close", (code) => {
      const combined = stdout + (stderr ? `\n${stderr}` : "");
      if (code === 0) {
        resolve({ ok: true, stdout: combined });
      } else {
        resolve({
          ok: false,
          stdout: combined,
          note: `claude exited with code ${code}. This is expected if claude is not installed or non-interactive mode is unavailable.`,
        });
      }
    });
  });
}
