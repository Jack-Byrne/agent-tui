import Redis from "ioredis";

/**
 * Assert the generated agent's Redis memory key exists and has persisted messages.
 * Key format matches templates/shared memory redis: `agent-tui:memory:<sessionId>`.
 */
export async function assertRedisMemorySession(args: {
  redisUrl: string;
  sessionId: string;
  minMessages: number;
}): Promise<void> {
  const r = new Redis(args.redisUrl);
  try {
    const key = `agent-tui:memory:${args.sessionId}`;
    const raw = await r.get(key);
    if (!raw) {
      throw new Error(`Redis: missing key ${key} (session not persisted?)`);
    }
    const data = JSON.parse(raw) as { messages?: unknown[] };
    const n = data.messages?.length ?? 0;
    if (n < args.minMessages) {
      throw new Error(
        `Redis: expected at least ${args.minMessages} messages in ${key}, got ${n}`,
      );
    }
  } finally {
    await r.quit();
  }
}
