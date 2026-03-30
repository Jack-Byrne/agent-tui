import React, { useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { useWizardStore } from "../wizard-store.js";
import type { LlmProvider } from "../../schema.js";
import { defaultModelForProvider } from "../../schema.js";

type Sub = "provider" | "model" | "temp" | "tokens" | "base" | "done";

export function LlmStep() {
  const llmProvider = useWizardStore((s) => s.llmProvider);
  const llmModel = useWizardStore((s) => s.llmModel);
  const llmTemperature = useWizardStore((s) => s.llmTemperature);
  const llmMaxTokens = useWizardStore((s) => s.llmMaxTokens);
  const llmBaseUrl = useWizardStore((s) => s.llmBaseUrl);
  const setLlmProvider = useWizardStore((s) => s.setLlmProvider);
  const setLlmModel = useWizardStore((s) => s.setLlmModel);
  const setLlmTemperature = useWizardStore((s) => s.setLlmTemperature);
  const setLlmMaxTokens = useWizardStore((s) => s.setLlmMaxTokens);
  const setLlmBaseUrl = useWizardStore((s) => s.setLlmBaseUrl);
  const next = useWizardStore((s) => s.next);

  const [sub, setSub] = useState<Sub>("provider");

  if (sub === "provider") {
    const items = (
      [
        "openai",
        "anthropic",
        "google",
        "azure_openai",
        "ollama",
      ] as LlmProvider[]
    ).map((p) => ({
      label: p,
      value: p,
    }));
    return (
      <Box flexDirection="column">
        <Text bold>LLM provider</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            const v = item.value as LlmProvider;
            setLlmProvider(v);
            setLlmModel(defaultModelForProvider(v));
            setSub("model");
          }}
        />
      </Box>
    );
  }

  if (sub === "model") {
    return (
      <Box flexDirection="column">
        <Text bold>Model id</Text>
        <TextInput
          value={llmModel}
          onChange={setLlmModel}
          onSubmit={() => setSub("temp")}
        />
      </Box>
    );
  }

  if (sub === "temp") {
    return (
      <Box flexDirection="column">
        <Text bold>Temperature (0–2)</Text>
        <TextInput
          value={String(llmTemperature)}
          onChange={(v) => {
            const n = Number(v);
            if (!Number.isNaN(n)) setLlmTemperature(n);
          }}
          onSubmit={() => setSub("tokens")}
        />
      </Box>
    );
  }

  if (sub === "tokens") {
    return (
      <Box flexDirection="column">
        <Text bold>Max tokens</Text>
        <TextInput
          value={String(llmMaxTokens)}
          onChange={(v) => {
            const n = Number(v);
            if (!Number.isNaN(n)) setLlmMaxTokens(Math.floor(n));
          }}
          onSubmit={() => setSub("base")}
        />
      </Box>
    );
  }

  if (sub === "base") {
    return (
      <Box flexDirection="column">
        <Text bold>Optional base URL (proxy / Ollama). Empty to skip.</Text>
        <TextInput
          value={llmBaseUrl}
          onChange={setLlmBaseUrl}
          onSubmit={() => {
            setSub("done");
            next();
          }}
        />
      </Box>
    );
  }

  return null;
}
