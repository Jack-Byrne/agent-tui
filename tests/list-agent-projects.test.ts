import fs from "fs-extra";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect, it } from "vitest";
import { listAgentProjectRoots } from "../src/tui/list-agent-projects.js";

describe("listAgentProjectRoots", () => {
  it("returns sorted dirs that contain agent.scaffold.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-tui-list-"));
    await fs.mkdir(join(root, "zeta"), { recursive: true });
    await fs.mkdir(join(root, "alpha"), { recursive: true });
    await fs.writeFile(join(root, "alpha", "agent.scaffold.json"), "{}");
    await fs.writeFile(join(root, "zeta", "agent.scaffold.json"), "{}");
    await fs.mkdir(join(root, "skip-me"), { recursive: true });

    const found = listAgentProjectRoots(root);
    expect(found.map((p) => p.split(/[/\\]/).pop())).toEqual(["alpha", "zeta"]);
  });

  it("returns empty for missing parent", () => {
    expect(listAgentProjectRoots(join(tmpdir(), "nope-not-here-12345"))).toEqual([]);
  });
});
