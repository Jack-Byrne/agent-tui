# agent-tui

Interactive terminal UI for scaffolding **TypeScript/Node agent projects** from the design patterns described in Google Cloud’s [Choose a design pattern for your agentic AI system](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system) guide.

The wizard collects choices (LLM provider, memory, planning, prompts, knowledge, tools, MCP, databases, optional Claude Code handoff) and renders a **multi-directory project** from Handlebars templates—using familiar libraries (**Ink**, **Commander**, **Zod**, **Vercel AI SDK** stubs in generated apps, optional **MCP SDK** skeleton).

## Requirements

- **Node.js** 20+
- A **real interactive terminal** (TTY). Ink needs raw mode; task runners and pipes without `/dev/tty` will not work for the menu or `create`.

## Install and build

```bash
git clone <repository-url>
cd agent-tui
npm install
npm run build
```

Global use (optional):

```bash
npm link
agent-tui
```

Or run from the repo:

```bash
node dist/cli.js
```

## Usage

```bash
agent-tui                      # default: interactive menu (same as menu)
agent-tui menu [-o ./out]       # Create / Reload / Run; lists projects under -o
agent-tui create [-o <dir>]     # wizard only; default parent dir is current directory
agent-tui create-from <path/to/agent.scaffold.json> [-o <dir>]
```

### Main menu (`agent-tui` or `agent-tui menu`)

- **Create** — multi-step wizard; new projects go to **`<output>/<project-name>/`** (menu default **`./out`**).
- **Reload** — subfolders of **`-o`** that contain **`agent.scaffold.json`**: pick one to regenerate from its manifest (same as **`create-from`**).
- **Run** — pick a project, optional user prompt; the TUI **temporarily unmounts** so **`npm run build`** and **`npm run start`** run in a normal terminal (full tsc + agent logs). When the agent finishes, the menu comes back with **another prompt**, **pick another project**, or **main menu**.

**`-o` on `menu`:** parent for new projects and the directory **Reload** / **Run** scan (default **`./out`**). **`create`** still uses **`-o`** as the project parent (default **`.`**).

**Regenerate without the TUI:** `agent-tui create-from ./out/my-agent/agent.scaffold.json`. Overwrites generated files; keep **`.env`** safe.

### In the wizard

- **Arrow keys** and **Enter** — navigate lists and confirm.
- **`b`** — go back one step.
- **Esc** — exit from the main menu; from **Create**, return to the menu (wizard resets); from Reload/Run pickers, back to menu.

### If your environment is not a TTY

Open an **integrated** or **system** terminal (not a headless runner), or on Linux try:

```bash
script -q -c 'node dist/cli.js' /dev/null
```

When stdin/stdout are not TTYs, the CLI may attach to `/dev/tty` on Unix so it can still find a controlling terminal.

## Wizard options (step by step)

Steps run in this order. Values are saved into **`agent.scaffold.json`** at the root of the generated project. The generator also emits TypeScript stubs; some choices (memory, planning) are **intent** you can wire up later—the emitted files do not fully implement every backend.

### 1. Project directory name

- **What it is:** Folder name for the new project: `<output>/<project-name>/`.
- **Rules:** Letters, numbers, and hyphens only (e.g. `my-agent`). Other characters fail validation at the summary step.
- **Default:** `my-agent`

### 2. Agent design pattern

Maps to the patterns in [Google’s agent design guide](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system). Each row is what you see in the TUI (label + one-line tradeoff). The **id** is what appears in `agent.scaffold.json` as `patternId`.

| Id | Meaning (short) | Tradeoff (summary) |
|----|-----------------|-------------------|
| `single_agent` | One model + tools + prompt handles the task. | Simple; weak if many roles fight in one prompt. |
| `react` | ReAct-style loop: model plans, calls tools, observes, repeats (via AI SDK `maxSteps`). | More adaptive; more calls and latency. |
| `sequential` | Fixed pipeline: stage A → B → C in order. | Cheap orchestration; rigid ordering. |
| `parallel` | Fan out perspectives in parallel, then merge. | Faster fan-out; merge logic and cost. |
| `loop` | Iterative pipeline (same **topology** as sequential in this scaffold). | Good for refinement; need exit guards. |
| `review_critique` | Generator + critic style workflow (same topology as sequential here). | Extra validation step; extra calls. |
| `iterative_refinement` | Polish over iterations (same topology as sequential here). | Quality vs iteration cost. |
| `coordinator` | Router classifies work and dispatches worker agents. | Flexible routing; more model calls. |
| `hierarchical` | Multi-level coordination (same **topology** as coordinator in this scaffold). | Powerful; complex and expensive. |
| `swarm` | Debate / multi-perspective merge (same topology as parallel here). | Rich output; convergence and cost risk. |
| `human_in_the_loop` | Draft + checkpoint; `SKIP_HITL=true` skips the note in code. | Safer; you must plug in real approval UX. |
| `custom_logic` | Code branches (e.g. parallel vs sequential) in one orchestrator. | Full control; you maintain branching. |

**Topology note:** Several pattern ids **share** the same generated layout (e.g. `loop` uses the sequential-style template). The **id** still records which Google pattern you picked; only the file layout is reused.

### 3. LLM

Sub-steps in order:

1. **Provider** — `openai` | `anthropic` | `google` | `azure_openai` | `ollama`
2. **Model id** — Any string (defaults switch when you change provider; you can override).
3. **Temperature** — `0`–`2` (sampling temperature in generated `llmDefaults`).
4. **Max tokens** — Upper bound per call in the stub (`maxTokens` passed into `generateText`).
5. **Optional base URL** — Free text or empty. If non-empty, `.env.example` includes `LLM_BASE_URL=...` (for OpenAI-compatible proxies). **Ollama** in generated code uses **`OLLAMA_BASE_URL`** (defaults to `http://127.0.0.1:11434` if unset).

**Secrets:** The wizard **never** asks for keys. Generated `.env.example` uses the primary env var for your provider:

| Provider | Default env var in manifest (`llm.apiKeyEnvVar`) | Generated runtime notes |
|----------|--------------------------------------------------|-------------------------|
| `openai` | `OPENAI_API_KEY` | Optional `LLM_BASE_URL` for proxy. |
| `anthropic` | `ANTHROPIC_API_KEY` | |
| `google` | `GOOGLE_GENERATIVE_AI_API_KEY` | |
| `azure_openai` | `AZURE_OPENAI_API_KEY` | Code also expects **`AZURE_RESOURCE_NAME`** for Azure OpenAI. |
| `ollama` | `OLLAMA_BASE_URL` | Local OpenAI-compatible `/v1` path; no real API key. |

Default model suggestions when you switch provider: `gpt-4o-mini`, `claude-sonnet-4-6`, `gemini-1.5-flash`, `gpt-4o` (Azure), `llama3.2` (Ollama). If the API returns `not_found_error` for a model id, your key may only see newer models—check [Anthropic’s model overview](https://docs.anthropic.com/en/docs/about-claude/models/overview) or list models with `curl -s https://api.anthropic.com/v1/models -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01"`.

### 4. Memory

What you intend for **conversation / state** storage. Generated code includes a small in-memory session helper in `src/memory/`; wiring Redis/SQL/etc. is left to you.

| Value | Meaning |
|-------|---------|
| `none` | No persistent conversation abstraction (stub still exists as documentation). |
| `conversation` | In-session message list (default in the wizard). |
| `file` | You plan to back memory with files/logs. |
| `redis` | You plan Redis-backed memory. |
| `db` | You plan relational (or other DB) memory. |

### 5. Planning

How **high-level planning** should behave conceptually. Emitted agents do not switch behavior for every value; use `agent.scaffold.json` as the contract when you add a planner.

| Value | Meaning |
|-------|---------|
| `none` | No separate planner abstraction. |
| `react_loop` | Prefer implicit plan–act via tool loops (default in wizard). |
| `planner_executor_stub` | You will add an explicit planner + executor split. |

### 6. Prompts

| Value | Meaning |
|-------|---------|
| `minimal` | Short system prompt: use tools when helpful. |
| `production` | Longer system prompt: safety, citations, concision. |

Output: `src/prompts/prompts.ts` exporting `systemPrompt`.

### 7. Knowledge / RAG

**First screen — knowledge mode:**

| Value | Meaning |
|-------|---------|
| `none` | No retrieval; `retrieveContext` returns empty string. |
| `filesystem_rag_stub` | Placeholder text: you index files under a knowledge dir. |
| `vector_db` | You want vector / embedding retrieval. |

If you pick **`vector_db`**, a **second screen** asks **vector backend** (stored as `vectorBackend`; if knowledge is not `vector_db`, the manifest forces `vectorBackend` to `none`):

| Value | Meaning |
|-------|---------|
| `stub` | Client-side stub only; no real DB in codegen. |
| `pgvector` | Adds **`pgvector`** dependency to generated `package.json` for you to wire up. |

If knowledge is not `vector_db`, you will not see the vector sub-step.

### 8. Tools

Multi-select menu: each line toggles inclusion; choose **Continue →** when done. Only **selected** tools are registered in `getTools()` for the model; all tool **files** are still generated so imports stay valid.

| Id | Meaning |
|----|---------|
| `http` | `http_fetch` tool: GET URL, return status + body preview (unsafe without an allowlist—harden before prod). |
| `filesystem_read` | Read UTF-8 file path; preview only (path policy is your responsibility). |
| `run_command` | Runs **`execFile`** only if `ALLOW_RUN_COMMAND=true`; otherwise returns a refusal object. |
| `custom_stub` | Echo tool for you to replace with domain logic. |

### 9. MCP (Model Context Protocol)

- **`config/mcp.example.json`** is **always** written: either from your `mcpServers` list or, if empty, a default **everything** demo server.
- **Toggle:** “Generate Node MCP server skeleton” adds **`mcp-servers/custom/`** (TypeScript, `@modelcontextprotocol/sdk`, `StdioServerTransport`).
- **Preset:** “everything demo” sets `mcpServers` to `{ name: everything, command: npx, args: [-y, @modelcontextprotocol/server-everything] }` so the manifest and JSON match.

There is no free-form “add N servers” editor in the TUI; extend the list by editing **`agent.scaffold.json`** after generate, or rerun the wizard.

### 10. SQL database

Two-step flow when **Drizzle + database stub** is on:

1. **Toggle** — Turn the feature on or off. Off skips the rest of this section.
2. **How to get a database** (`sqlBootstrap` in `agent.scaffold.json`):

| Choice | Meaning |
|--------|---------|
| **I have a DATABASE_URL** (`connection_url`) | You already use hosted or local Postgres (or compatible). Generates Drizzle + **`pg`**, `.env.example` with a generic placeholder URL, and you name the env var (default `DATABASE_URL`). |
| **Docker Compose** (`docker_postgres`) | You do not have Postgres yet. Writes **`docker-compose.yml`** (Postgres 16, user/password/db `postgres`/`postgres`/`agent`, port `5432`) and sets `.env.example` to `postgres://postgres:postgres@localhost:5432/agent`. You still confirm the env var name (default `DATABASE_URL`). Run `docker compose up -d` in the generated project. |
| **SQLite file** (`sqlite_file`) | No server. Generates Drizzle + **`better-sqlite3`**, **`SQLITE_PATH`** in `.env.example`, and a stub that creates parent dirs for the DB file. You enter a path under the project (default `data/local.db`). Runtime override: `SQLITE_PATH`. |

Shared for all SQL modes: **`src/db/drizzle-stub.ts`**, a **`.gitignore`** entry for `data/*.db`, and README notes for your chosen mode.

**Note:** **`pgvector`** in the Knowledge step targets Postgres; if you select **SQLite** for SQL and **pgvector** for vectors, you must align storage yourself (the scaffold only adds a dependency hint).

Vector choice (`pgvector`) is otherwise separate: it only adds the **`pgvector`** npm package hint, not a full schema.

### 11. Claude Code

| Option | Meaning |
|--------|---------|
| Write **`claude-handoff.md`** | Markdown brief for Claude Code: layout, pattern, MCP notes, suggested follow-ups (default on). |
| Try **`claude -p`** after generate | Best-effort subprocess call to `claude` in the new project directory (default off); often fails if `claude` is missing or Node spawn issues; message still prints. |

### 12. Summary

- Review all choices; **Generate project** or **Back**.
- Output directory is **`<output>/<project-name>/`**.

### Persisted manifest

**`agent.scaffold.json`** stores every answer above (`patternId`, `llm`, `memory`, `planning`, `sqlBootstrap`, `sqliteFilePath`, …) plus `scaffoldVersion`, `generatedAt`, and `googlePatternGuide` (link to the same Google doc). Use it for reproducible regenerations or tooling.

## Integration testing (generated agents)

Generated apps support an **offline mock LLM** via `AGENT_TUI_MOCK_LLM=1` and scenario scripts in [`templates/shared/src/llm/mock-language-model.ts`](templates/shared/src/llm/mock-language-model.ts) (`AGENT_TUI_MOCK_SCENARIO`, `AGENT_TUI_MOCK_TEXT`, …). **Live** runs use real provider keys from `.env` (Ollama is out of scope for this matrix).

**Master env + Docker (optional):** copy [`integration/env.example`](integration/env.example) to `integration/.env` (gitignored), then start [`integration/docker-compose.yml`](integration/docker-compose.yml) for Redis and Postgres/pgvector. [`integration/merge-env.ts`](integration/merge-env.ts) merges that file into each fixture when you run the harness.

**Commands:**

```bash
npm test                         # unit tests only (fast)
npm run test:integration         # mock LLM, quick scenario subset (~6); uses fresh temp dirs per run
npm run test:integration:all     # all scenarios below (skips Redis scenario unless REDIS_URL is set)
npm run integration:generate     # write ./integration-out/<id>/ (or AGENT_TUI_INTEGRATION_OUT); optional: scenario id arg
npm run integration:run          # mock LLM against integration-out/ (reuses existing dirs — npm install skips work from cache)
AGENT_TUI_LIVE_LLM=1 npm run integration:run   # live providers (requires keys in integration/.env)
AGENT_TUI_INTEGRATION_CLEAN=1 npm run integration:run   # delete each fixture dir before regenerate (slow, pristine tree)
```

By default, **`integration/run.ts` does not delete** `integration-out/<scenario-id>/`, so repeat runs keep **`node_modules`** and are usually much faster. `generateProject` still overwrites generated sources on each run. Set **`AGENT_TUI_INTEGRATION_CLEAN=1`** when you need a completely clean directory (e.g. dependency changes).

**Redis + Postgres/pgvector (Docker Compose):** from the repo root, bring up [`integration/docker-compose.yml`](integration/docker-compose.yml). Use whichever command your install supports (many distros only have the older **hyphen** binary):

```bash
docker compose -f integration/docker-compose.yml up -d    # Compose V2 (plugin)
docker-compose -f integration/docker-compose.yml up -d      # Compose v1 standalone
```

Published host ports are **`16379` → Redis** and **`15432` → Postgres** so they do not collide with typical local services on **`6379`** / **`5432`**. Match [`integration/env.example`](integration/env.example): `REDIS_URL` on `16379`, `DATABASE_URL` on `15432`.

**Ubuntu + stock `docker.io`:** you may see `docker: unknown command: docker compose` and `Unable to locate package docker-compose-plugin`. The plugin comes from [Docker’s APT repo](https://docs.docker.com/engine/install/ubuntu/), or install a [Compose v2 release binary](https://github.com/docker/compose/releases) as `docker-compose` under `/usr/local/bin`.

**Ubuntu 24.04 + `apt install docker-compose`:** that package is Compose **1.29** (Python) and often crashes with `ModuleNotFoundError: No module named 'distutils'` on Python 3.12. Remove it and use the **GitHub binary** or Docker’s **`docker-compose-plugin`** from Docker’s APT repo instead.

Then export **`REDIS_URL`**, **`DATABASE_URL`**, and **`OPENAI_API_KEY`** (see [`integration/env.example`](integration/env.example)). With those set:

- **`memory-redis`** — runs the agent with Redis-backed memory and asserts the session key has persisted messages.
- **`knowledge-pgvector-postgres`** — seeds `agent_knowledge_chunks`, runs the agent, then asserts **`retrieveContext`** returns the seeded text (real embedding API call).

Without those env vars, Vitest **skips** those scenarios (other integration tests still run).

**Scenario status matrix** (update as you verify live / services):

| Scenario id | Mock (CI quick) | Mock (full suite) | Live LLM | Services | Notes |
|-------------|-----------------|-------------------|----------|---------|-------|
| single-default | yes | yes | manual | none | Conversation memory |
| single-tools-http | yes | yes | manual | none | HTTP tool + mock tool round-trip |
| single-production-prompt | — | yes | manual | none | Production prompt pack |
| react-tool-loop | yes | yes | manual | none | ReAct + tools |
| sequential-pipeline | yes | yes | manual | none | Multi-stage pipeline |
| parallel-batch | — | yes | manual | none | Parallel fan-out |
| coordinator-routing | — | yes | manual | none | Mock classify uses token heuristic |
| hitl-skip | — | yes | manual | none | Uses `SKIP_HITL=true` in test env |
| custom-orchestrator | — | yes | manual | none | Custom branch |
| planner-executor | — | yes | manual | none | `planner_executor_stub` + `planner_stub` mock |
| memory-file-persist | — | yes | manual | none | `MEMORY_FILE_PATH` |
| memory-db-sqlite | — | yes | manual | none | SQLite + Drizzle memory table |
| memory-redis | skip without `REDIS_URL` | yes when `REDIS_URL` | manual | Redis | Asserts Redis key after run |
| sql-sqlite-smoke | yes | yes | manual | none | `npm run sql:smoke` |
| knowledge-pgvector-postgres | skip without DB+key | yes when `DATABASE_URL` + `OPENAI_API_KEY` | manual | Postgres | Seed + `retrieveContext` assert |
| knowledge-fs-stub | — | yes | manual | none | Filesystem RAG stub in prompt chain |
| mcp-skeleton | yes | yes | manual | none | Builds `mcp-servers/custom` (echo tool) |

**Pgvector:** scenario **`knowledge-pgvector-postgres`** exercises the generated pgvector path when Docker Postgres and `OPENAI_API_KEY` are available (see above).

## Development

```bash
npm run dev -- create -o ./out   # run CLI via tsx (no build step)
npm test                         # Vitest: schemas + generator layout (excludes integration/)
npm run test:integration         # generated agent smoke (mock LLM)
npm run build                    # compile to dist/
```

## Project layout (this repo)

| Path | Role |
|------|------|
| `src/cli.ts` | Commander entry, Ink `render`, TTY/`/dev/tty` handling |
| `src/tui/` | Wizard UI (steps + Zustand store) |
| `src/patterns/registry.ts` | Pattern ids aligned with the Google doc |
| `src/schema.ts` | Zod schemas for answers |
| `src/generate/` | Manifest, Handlebars writer, MCP JSON, Claude handoff/spawn |
| `templates/shared/` | Files shared by all generated projects |
| `templates/topologies/` | Per-topology `src/agents` and entrypoint |
| `templates/mcp-skeleton/` | Optional MCP server stub |
| `integration/` | Docker/env templates, scenario definitions, generate + run scripts |
| `tests/` | Schema, generator, and integration harness tests |

## License

See [package.json](package.json) for package metadata. Add a `LICENSE` file if you publish this repo publicly.
