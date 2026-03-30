import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { mkdir } from "node:fs/promises";
import { basename, dirname } from "pathe";
import { WizardApp } from "./WizardApp.js";
import { listAgentProjectRoots, manifestPathForProjectRoot } from "./list-agent-projects.js";
import { resetWizard } from "./wizard-store.js";
import type { ScaffoldAnswers } from "../schema.js";

export type RunResume = {
  type: "post_run";
  projectRoot: string;
  exitCode: number | null;
  runError?: string;
};

type Screen =
  | { type: "menu" }
  | { type: "create" }
  | {
      type: "reload";
      phase: "pick" | "busy" | "done";
      projectRoot?: string;
      message?: string;
      error?: string;
    }
  | {
      type: "run";
      phase: "pick" | "prompt" | "after_run";
      projectRoot?: string;
      promptDraft?: string;
      lastExitCode?: number | null;
      lastError?: string;
    };

type MenuScreen = Exclude<Screen, { type: "create" }>;

function initialScreenFromResume(resume: RunResume | null | undefined): Screen {
  if (resume?.type === "post_run") {
    return {
      type: "run",
      phase: "after_run",
      projectRoot: resume.projectRoot,
      lastExitCode: resume.exitCode,
      lastError: resume.runError,
    };
  }
  return { type: "menu" };
}

interface Props {
  /** Parent directory whose subfolders are agent projects (e.g. resolved `./out`). */
  projectsParentDir: string;
  /** When set (e.g. after remounting), opens the post-run choices for this project. */
  initialResume?: RunResume | null;
  onWizardDone: (result: {
    answers: ScaffoldAnswers;
    outputDir: string;
    claudeStdout?: string;
    claudeNote?: string;
  }) => void;
  onExit: (code: number) => void;
  /**
   * Unmount Ink, run agent in plain terminal, then the host should remount the TUI
   * (passing {@link initialResume} with the outcome).
   */
  runGeneratedAgentInFolder: (projectRoot: string, userPrompt: string) => void;
}

interface MenuShellProps {
  projectsParentDir: string;
  screen: MenuScreen;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  onExit: (code: number) => void;
  runGeneratedAgentInFolder: (projectRoot: string, userPrompt: string) => void;
}

function MenuShell({
  projectsParentDir,
  screen,
  setScreen,
  onExit,
  runGeneratedAgentInFolder,
}: MenuShellProps) {
  const projects = listAgentProjectRoots(projectsParentDir);
  const projectItems = projects.map((root) => ({
    label: basename(root),
    value: root,
  }));

  useInput((_input, key) => {
    if (!key.escape) return;
    if (screen.type === "menu") {
      onExit(0);
      return;
    }
    if (screen.type === "reload" && screen.phase === "pick") {
      setScreen({ type: "menu" });
      return;
    }
    if (screen.type === "reload" && screen.phase === "done") {
      setScreen({ type: "menu" });
      return;
    }
    if (
      screen.type === "run" &&
      (screen.phase === "pick" ||
        screen.phase === "prompt" ||
        screen.phase === "after_run")
    ) {
      setScreen({ type: "menu" });
    }
  });

  useEffect(() => {
    if (screen.type !== "reload" || screen.phase !== "busy" || !screen.projectRoot) {
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const { loadScaffoldAnswersFromAgentFile } = await import(
          "../generate/manifest.js"
        );
        const { generateProject } = await import("../generate/writer.js");
        const manifestPath = manifestPathForProjectRoot(screen.projectRoot!);
        const parent = dirname(screen.projectRoot!);
        const { answers, outputDir } = await loadScaffoldAnswersFromAgentFile(
          manifestPath,
          { outputDir: parent },
        );
        await mkdir(outputDir, { recursive: true });
        const result = await generateProject(outputDir, answers);
        if (!cancelled) {
          setScreen({
            type: "reload",
            phase: "done",
            message: `Regenerated: ${result.outputDir}`,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setScreen({
            type: "reload",
            phase: "done",
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [screen, setScreen]);

  if (screen.type === "reload") {
    if (screen.phase === "pick") {
      if (projectItems.length === 0) {
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Reload</Text>
            <Text dimColor>
              No projects in {projectsParentDir} (need subdirs with agent.scaffold.json). Esc
              to menu.
            </Text>
          </Box>
        );
      }
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Reload — regenerate from manifest</Text>
          <Text dimColor>Parent: {projectsParentDir} — Esc back</Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                ...projectItems,
                { label: "← Back to menu", value: "__back" },
              ]}
              onSelect={(item) => {
                if (item.value === "__back") {
                  setScreen({ type: "menu" });
                  return;
                }
                setScreen({
                  type: "reload",
                  phase: "busy",
                  projectRoot: item.value,
                });
              }}
            />
          </Box>
        </Box>
      );
    }
    if (screen.phase === "busy") {
      return (
        <Box padding={1}>
          <Text>Regenerating {screen.projectRoot ? basename(screen.projectRoot) : "…"}…</Text>
        </Box>
      );
    }
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Reload</Text>
        {screen.error ? (
          <Text color="red">{screen.error}</Text>
        ) : (
          <Text color="green">{screen.message ?? "Done."}</Text>
        )}
        <Text dimColor>Esc — menu</Text>
      </Box>
    );
  }

  if (screen.type === "run") {
    if (screen.phase === "after_run" && screen.projectRoot) {
      const root = screen.projectRoot;
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Run — {basename(root)}</Text>
          {screen.lastError ? (
            <Text color="red">{screen.lastError}</Text>
          ) : (
            <Text>
              Last run exit code:{" "}
              {screen.lastExitCode === null ? "?" : String(screen.lastExitCode)}
            </Text>
          )}
          <Text dimColor>Esc — main menu</Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                { label: "New prompt (same project)", value: "again" },
                { label: "Pick another project", value: "pick" },
                { label: "← Main menu", value: "menu" },
              ]}
              onSelect={(item) => {
                if (item.value === "again") {
                  setScreen({
                    type: "run",
                    phase: "prompt",
                    projectRoot: root,
                    promptDraft: "",
                  });
                } else if (item.value === "pick") {
                  setScreen({ type: "run", phase: "pick" });
                } else {
                  setScreen({ type: "menu" });
                }
              }}
            />
          </Box>
        </Box>
      );
    }

    if (screen.phase === "pick") {
      if (projectItems.length === 0) {
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Run agent</Text>
            <Text dimColor>
              No projects in {projectsParentDir}. Esc to menu.
            </Text>
          </Box>
        );
      }
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Run — choose project</Text>
          <Text dimColor>
            Next: plain terminal — npm build + npm start (full agent output). Esc back.
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                ...projectItems,
                { label: "← Back to menu", value: "__back" },
              ]}
              onSelect={(item) => {
                if (item.value === "__back") {
                  setScreen({ type: "menu" });
                  return;
                }
                setScreen({
                  type: "run",
                  phase: "prompt",
                  projectRoot: item.value,
                  promptDraft: "",
                });
              }}
            />
          </Box>
        </Box>
      );
    }
    if (screen.phase === "prompt" && screen.projectRoot) {
      const draft = screen.promptDraft ?? "";
      const root = screen.projectRoot;
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Prompt for {basename(root)}</Text>
          <Text dimColor>
            Enter message (empty = project default). Enter runs in terminal with full logs. Esc —
            menu.
          </Text>
          <Box marginTop={1}>
            <TextInput
              value={draft}
              onChange={(v) =>
                setScreen({
                  type: "run",
                  phase: "prompt",
                  projectRoot: root,
                  promptDraft: v,
                })
              }
              onSubmit={() => {
                runGeneratedAgentInFolder(root, draft);
              }}
            />
          </Box>
        </Box>
      );
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>agent-tui</Text>
      <Text dimColor>Projects folder: {projectsParentDir} — Esc exit</Text>
      <Box marginTop={1}>
        <SelectInput
          items={[
            { label: "Create — new agent (wizard)", value: "create" },
            { label: "Reload — regenerate from agent.scaffold.json", value: "reload" },
            { label: "Run — rebuild (tsc) then npm start", value: "run" },
          ]}
          onSelect={(item) => {
            if (item.value === "create") {
              resetWizard();
              setScreen({ type: "create" });
            } else if (item.value === "reload") {
              setScreen({ type: "reload", phase: "pick" });
            } else if (item.value === "run") {
              setScreen({ type: "run", phase: "pick" });
            }
          }}
        />
      </Box>
    </Box>
  );
}

export function MainApp({
  projectsParentDir,
  initialResume = null,
  onWizardDone,
  onExit,
  runGeneratedAgentInFolder,
}: Props) {
  const [screen, setScreen] = useState<Screen>(() =>
    initialScreenFromResume(initialResume ?? null),
  );

  if (screen.type === "create") {
    return (
      <WizardApp
        outputDir={projectsParentDir}
        onDone={onWizardDone}
        onCancel={() => {
          resetWizard();
          setScreen({ type: "menu" });
        }}
      />
    );
  }

  return (
    <MenuShell
      projectsParentDir={projectsParentDir}
      screen={screen}
      setScreen={setScreen}
      onExit={onExit}
      runGeneratedAgentInFolder={runGeneratedAgentInFolder}
    />
  );
}
