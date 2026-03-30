#!/usr/bin/env node
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import fs from "node:fs";
import tty from "node:tty";
import { mkdir } from "node:fs/promises";
import { resolve } from "pathe";
import { App } from "./tui/App.js";

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

const program = new Command();

program
  .name("agent-tui")
  .description("Scaffold AI agent projects from Google Cloud design patterns")
  .version("0.1.0");

program
  .command("create")
  .description("Interactive wizard → generated project")
  .option("-o, --output <dir>", "Output directory (parent of project folder)", ".")
  .action(async (opts: { output: string }) => {
    const fromDevTty = controllingTerminalStreams();
    const stdin =
      process.stdin.isTTY
        ? process.stdin
        : (fromDevTty?.stdin as typeof process.stdin | undefined);
    const stdout =
      process.stdout.isTTY
        ? process.stdout
        : (fromDevTty?.stdout as typeof process.stdout | undefined);

    if (!stdin?.isTTY || !stdout?.isTTY) {
      console.error(
        "agent-tui create needs an interactive terminal.\n" +
          "  • Open the integrated terminal (Ctrl+`) and run: node dist/cli.js create -o ./out\n" +
          "  • Or from any shell: script -q -c 'node dist/cli.js create -o ./out' /dev/null",
      );
      process.exit(1);
    }

    const outputDir = resolve(process.cwd(), opts.output);
    await mkdir(outputDir, { recursive: true });
    const { waitUntilExit } = render(
      React.createElement(App, {
        outputDir,
        onDone: ({ outputDir: out, claudeStdout, claudeNote }) => {
          console.log("\nGenerated:", out);
          if (claudeNote) console.log("\nClaude:", claudeNote);
          if (claudeStdout) console.log(claudeStdout);
          process.exit(0);
        },
      }),
      { stdin, stdout, stderr: process.stderr, patchConsole: true },
    );
    await waitUntilExit();
  });

program.parse();
