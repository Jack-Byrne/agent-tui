import React, { useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { useWizardStore } from "../wizard-store.js";
import type { SqlBootstrap } from "../../schema.js";

type Phase = "main" | "bootstrap" | "env" | "sqlitePath";

export function DatabaseStep() {
  const useSql = useWizardStore((s) => s.useSqlDatabase);
  const sqlBootstrap = useWizardStore((s) => s.sqlBootstrap);
  const sqliteFilePath = useWizardStore((s) => s.sqliteFilePath);
  const envVar = useWizardStore((s) => s.databaseUrlEnvVar);
  const setUse = useWizardStore((s) => s.setUseSqlDatabase);
  const setBootstrap = useWizardStore((s) => s.setSqlBootstrap);
  const setSqlitePath = useWizardStore((s) => s.setSqliteFilePath);
  const setEnv = useWizardStore((s) => s.setDatabaseUrlEnvVar);
  const next = useWizardStore((s) => s.next);
  const [phase, setPhase] = useState<Phase>("main");

  if (phase === "main") {
    return (
      <Box flexDirection="column">
        <Text bold>SQL database (Drizzle)</Text>
        <Text dimColor>
          Optional. If you do not have Postgres yet, choose Docker or SQLite in the next step.
        </Text>
        <SelectInput
          items={[
            {
              label: `${useSql ? "[on]" : "[off]"} Enable Drizzle + database stub`,
              value: "toggle",
            },
            { label: "Continue →", value: "go" },
          ]}
          onSelect={(item) => {
            if (item.value === "toggle") {
              setUse(!useSql);
              return;
            }
            if (!useSql) {
              next();
              return;
            }
            setPhase("bootstrap");
          }}
        />
      </Box>
    );
  }

  if (phase === "bootstrap") {
    const items: { label: string; value: SqlBootstrap }[] = [
      {
        label: "I have a DATABASE_URL (existing Postgres or other)",
        value: "connection_url",
      },
      {
        label: "Create local Postgres via Docker Compose (no DB yet)",
        value: "docker_postgres",
      },
      {
        label: "Use SQLite file (simplest, no server)",
        value: "sqlite_file",
      },
    ];
    return (
      <Box flexDirection="column">
        <Text bold>How should this project get a database?</Text>
        <Text dimColor>Current: {sqlBootstrap}</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            const v = item.value as SqlBootstrap;
            setBootstrap(v);
            if (v === "sqlite_file") setPhase("sqlitePath");
            else {
              if (v === "docker_postgres") setEnv("DATABASE_URL");
              setPhase("env");
            }
          }}
        />
      </Box>
    );
  }

  if (phase === "sqlitePath") {
    return (
      <Box flexDirection="column">
        <Text bold>SQLite file path (under project root)</Text>
        <Text dimColor>Stored in agent.scaffold.json; override at runtime with SQLITE_PATH.</Text>
        <TextInput
          value={sqliteFilePath}
          onChange={setSqlitePath}
          onSubmit={() => next()}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>
        {sqlBootstrap === "docker_postgres"
          ? "Env var name for Postgres URL (matches docker-compose)"
          : "Env var name for database URL"}
      </Text>
      {sqlBootstrap === "docker_postgres" ? (
        <Text dimColor>
          Default .env line will be postgres://postgres:postgres@localhost:5432/agent
        </Text>
      ) : null}
      <TextInput value={envVar} onChange={setEnv} onSubmit={() => next()} />
    </Box>
  );
}
