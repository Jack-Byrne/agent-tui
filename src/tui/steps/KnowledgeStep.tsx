import React, { useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useWizardStore } from "../wizard-store.js";
import type { KnowledgeKind, VectorBackend } from "../../schema.js";

type Phase = "knowledge" | "vector";

export function KnowledgeStep() {
  const knowledge = useWizardStore((s) => s.knowledge);
  const vectorBackend = useWizardStore((s) => s.vectorBackend);
  const setKnowledge = useWizardStore((s) => s.setKnowledge);
  const setVectorBackend = useWizardStore((s) => s.setVectorBackend);
  const next = useWizardStore((s) => s.next);

  const [phase, setPhase] = useState<Phase>("knowledge");

  if (phase === "knowledge") {
    const items = (
      [
        "none",
        "filesystem_rag_stub",
        "vector_db",
      ] as KnowledgeKind[]
    ).map((k) => ({
      label: k === knowledge ? `* ${k}` : k,
      value: k,
    }));
    return (
      <Box flexDirection="column">
        <Text bold>Knowledge / RAG</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            const v = item.value as KnowledgeKind;
            setKnowledge(v);
            if (v === "vector_db") setPhase("vector");
            else next();
          }}
        />
      </Box>
    );
  }

  const vitems = (["stub", "pgvector"] as VectorBackend[]).map((v) => ({
    label: v === vectorBackend ? `* ${v}` : v,
    value: v,
  }));

  return (
    <Box flexDirection="column">
      <Text bold>Vector backend</Text>
      <SelectInput
        items={vitems}
        onSelect={(item) => {
          setVectorBackend(item.value as VectorBackend);
          next();
        }}
      />
    </Box>
  );
}
