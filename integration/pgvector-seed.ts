import pg from "pg";

const RAG_MARKER = "UNIQUE_INTEGRATION_RAG_7e2f Integration policy: prefer tools.";

async function openaiEmbedding(
  apiKey: string,
  text: string,
  model: string,
): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embeddings failed ${res.status}: ${body}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ embedding: number[] }>;
  };
  const emb = json.data?.[0]?.embedding;
  if (!emb?.length) throw new Error("OpenAI embeddings: empty embedding");
  return emb;
}

/**
 * Prepare Postgres (pgvector) for integration: extension, table, one seeded row.
 * Uses the same table/column layout as generated `knowledge.ts` (vector(1536)).
 */
export async function seedPgVectorRagTable(args: {
  databaseUrl: string;
  openaiApiKey: string;
  embeddingModel?: string;
}): Promise<{ retrievalQuery: string; marker: string }> {
  const marker = RAG_MARKER;
  const retrievalQuery = marker;
  const model = args.embeddingModel ?? "text-embedding-3-small";

  const embedding = await openaiEmbedding(args.openaiApiKey, marker, model);
  if (embedding.length !== 1536) {
    throw new Error(
      `Expected 1536-dim embedding for pgvector schema, got ${embedding.length}`,
    );
  }

  const pool = new pg.Pool({ connectionString: args.databaseUrl });
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_knowledge_chunks (
        id BIGSERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536) NOT NULL
      )
    `);
    await pool.query("TRUNCATE agent_knowledge_chunks");
    const vectorLiteral = `[${embedding.join(",")}]`;
    await pool.query(
      `INSERT INTO agent_knowledge_chunks (content, embedding) VALUES ($1, $2::vector)`,
      [marker, vectorLiteral],
    );
  } finally {
    await pool.end();
  }

  return { retrievalQuery, marker };
}
