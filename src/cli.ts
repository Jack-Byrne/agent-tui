#!/usr/bin/env node
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import fs from "node:fs";
import tty from "node:tty";
import { mkdir } from "node:fs/promises";
import { basename, resolve } from "pathe";
import { runGeneratedAgent } from "./run-generated-agent.js";
import { MainApp, type RunResume, WizardApp } from "./tui/App.js";

/**
 * When launched from a non-TTY parent (task runners, pipes), attach to the
 * controlling terminal so Ink can use raw mode (Unix).
 */
function controllingTerminalStreams(): {
  stdin: NodeJS.ReadStream & { isTTY: boolean };
  stdout: NodeJS.WriteStream & { isTTY: boolean };
} | null {
  try {
    const inFd = fs.openSync("/dev/tty", "r");
    const outFd = fs.openSync("/dev/tty", "w");
    return {
      stdin: new tty.ReadStream(inFd),
      stdout: new tty.WriteStream(outFd),
    };
  } catch {
    return null;
  }
}

function getInteractiveStreams(): {
  stdin: NodeJS.ReadStream & { isTTY: boolean };
  stdout: NodeJS.WriteStream & { isTTY: boolean };
} | null {
  const fromDevTty = controllingTerminalStreams();
  const stdin =
    process.stdin.isTTY
      ? process.stdin
      : (fromDevTty?.stdin as typeof process.stdin | undefined);
  const stdout =
    process.stdout.isTTY
      ? process.stdout
      : (fromDevTty?.stdout as typeof process.stdout | undefined);
  if (!stdin?.isTTY || !stdout?.isTTY) return null;
  return { stdin, stdout };
}

function mountMainMenu(
  streams: {
    stdin: NodeJS.ReadStream & { isTTY: boolean };
    stdout: NodeJS.WriteStream & { isTTY: boolean };
  },
  projectsParentDir: string,
  resume?: RunResume | null,
): void {
  const { stdin, stdout } = streams;
  const ink = render(
    React.createElement(MainApp, {
      projectsParentDir,
      initialResume: resume ?? null,
      onWizardDone: ({ outputDir: out, claudeStdout, claudeNote }) => {
        ink.unmount();
        console.log("\nGenerated:", out);
        if (claudeNote) console.log("\nClaude:", claudeNote);
        if (claudeStdout) console.log(claudeStdout);
        process.exit(0);
      },
      onExit: (code) => {
        ink.unmount();
        process.exit(code);
      },
      runGeneratedAgentInFolder: (projectRoot, userPrompt) => {
        ink.unmount();
        void (async () => {
          const name = basename(projectRoot);
          console.log(
            `\n── ${name}: npm run build, then npm run start (full output below) ──\n`,
          );
          const code = await runGeneratedAgent(projectRoot, userPrompt);
          const runError =
            code === null ? "Could not run npm in that folder." : undefined;
          console.log(
            `\n── ${name} finished (exit ${code === null ? "?" : code}). ──\n`,
          );
          mountMainMenu(streams, projectsParentDir, {
            type: "post_run",
            projectRoot,
            exitCode: code,
            runError,
          });
        })();
      },
    }),
    { stdin, stdout, stderr: process.stderr, patchConsole: true },
  );
}

const program = new Command();

program
  .name("agent-tui")
  .description("Scaffold AI agent projects from Google Cloud design patterns")
  .version("0.1.0");

program
  .command("menu", { isDefault: true })
  .description("Interactive menu: create, reload, run (default command)")
  .option(
    "-o, --output <dir>",
    "Parent directory listing agent projects (Create writes here; Reload/Run scan it)",
    "./out",
  )
  .action(async (opts: { output: string }) => {
    const streams = getInteractiveStreams();
    if (!streams) {
      console.error(
        "agent-tui needs an interactive terminal.\n" +
          "  • Open the integrated terminal (Ctrl+`) and run: node dist/cli.js\n" +
          "  • Or: script -q -c 'node dist/cli.js' /dev/null",
      );
      process.exit(1);
    }

    const projectsParentDir = resolve(process.cwd(), opts.output);
    await mkdir(projectsParentDir, { recursive: true });
    mountMainMenu(streams, projectsParentDir);
  });

program
  .command("create")
  .description("Interactive wizard only (no main menu)")
  .option("-o, --output <dir>", "Output directory (parent of project folder)", ".")
  .action(async (opts: { output: string }) => {
    const streams = getInteractiveStreams();
    if (!streams) {
      console.error(
        "agent-tui create needs an interactive terminal.\n" +
          "  • Open the integrated terminal (Ctrl+`) and run: node dist/cli.js create -o ./out\n" +
          "  • Or from any shell: script -q -c 'node dist/cli.js create -o ./out' /dev/null",
      );
      process.exit(1);
    }

    const outputDir = resolve(process.cwd(), opts.output);
    await mkdir(outputDir, { recursive: true });
    const { stdin, stdout } = streams;
    const { waitUntilExit } = render(
      React.createElement(WizardApp, {
        outputDir,
        onDone: ({ outputDir: out, claudeStdout, claudeNote }) => {
          console.log("\nGenerated:", out);
          if (claudeNote) console.log("\nClaude:", claudeNote);
          if (claudeStdout) console.log(claudeStdout);
          process.exit(0);
        },
        onCancel: () => process.exit(0),
      }),
      { stdin, stdout, stderr: process.stderr, patchConsole: true },
    );
    await waitUntilExit();
  });

program
  .command("create-from")
  .description(
    "Regenerate a project from agent.scaffold.json (same options as the last wizard run; no TTY)",
  )
  .argument("<manifest>", "Path to agent.scaffold.json")
  .option(
    "-o, --output <dir>",
    "Parent directory for the project folder (default: inferred if manifest is at <dir>/<projectName>/agent.scaffold.json)",
  )
  .action(
    async (
      manifest: string,
      opts: { output?: string },
    ): Promise<void> => {
      try {
        const { loadScaffoldAnswersFromAgentFile } = await import(
          "./generate/manifest.js"
        );
        const { generateProject } = await import("./generate/writer.js");
        const { answers, outputDir } = await loadScaffoldAnswersFromAgentFile(
          manifest,
          { outputDir: opts.output },
        );
        await mkdir(outputDir, { recursive: true });
        const result = await generateProject(outputDir, answers);
        console.log("\nGenerated:", result.outputDir);
        if (result.claudeSpawnNote) console.log("\nClaude:", result.claudeSpawnNote);
        if (result.claudeSpawnStdout) console.log(result.claudeSpawnStdout);
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
      }
    },
  );

program.parse();
