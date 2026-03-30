import { spawn } from "node:child_process";

function pauseStdinRawMode(): () => void {
  const stdin = process.stdin;
  if (stdin.isTTY && typeof stdin.setRawMode === "function") {
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(false);
    return () => {
      if (stdin.isTTY && typeof stdin.setRawMode === "function") {
        stdin.setRawMode(wasRaw);
      }
    };
  }
  return () => {};
}

export function runNpmInProject(
  projectRoot: string,
  npmArgs: string[],
): Promise<number | null> {
  return new Promise((resolve) => {
    const resumeRaw = pauseStdinRawMode();
    const child = spawn("npm", npmArgs, {
      cwd: projectRoot,
      stdio: "inherit",
      env: process.env,
      shell: false,
    });
    child.on("close", (code) => {
      resumeRaw();
      resolve(code);
    });
    child.on("error", () => {
      resumeRaw();
      resolve(null);
    });
  });
}

/** `npm run build` then `npm run start` (optional prompt after `--`). Call after Ink has unmounted. */
export async function runGeneratedAgent(
  projectRoot: string,
  userPrompt: string,
): Promise<number | null> {
  const buildCode = await runNpmInProject(projectRoot, ["run", "build"]);
  if (buildCode === null || buildCode !== 0) {
    return buildCode;
  }
  const startArgs =
    userPrompt.trim().length > 0
      ? ["run", "start", "--", userPrompt.trim()]
      : ["run", "start"];
  return runNpmInProject(projectRoot, startArgs);
}
