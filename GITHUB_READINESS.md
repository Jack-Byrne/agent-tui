# GitHub / public release checklist

Use this as a todo list before pointing strangers at the repo. Check items off as you go.

## Legal & ownership

- [ ] Add a **`LICENSE`** file (MIT, Apache-2.0, etc.) and match it to how you want derivatives used.
- [ ] Confirm **third-party licenses** are acceptable (Ink, AI SDK in *generated* apps, MCP SDK skeleton, etc.—your tool’s `package.json` deps are the main concern for *this* repo).
- [ ] If you publish to **npm**, ensure the **package `name`** is available and not a trademark problem (`agent-tui` may already be taken—verify on [npmjs.com](https://www.npmjs.com/)).

## Repository metadata

- [ ] Create the **GitHub repo** (public) and push this tree.
- [ ] Fill in **About**: description, website (if any), topics (e.g. `cli`, `agent`, `scaffold`, `typescript`, `ink`, `mcp`, `drizzle`).
- [ ] Set **default branch** (e.g. `main`) and branch protection if you take PRs.
- [ ] Add **`package.json` `repository`**, `bugs`, and `homepage`** fields pointing at GitHub (and npm page if you publish).

## Hygiene (don’t leak noise or secrets)

- [ ] **`out/`** is gitignored (local wizard output).
- [ ] No **secrets** committed (`.env`, keys, tokens). Grep for `sk-`, `API_KEY` assignments, etc.
- [ ] No **machine-specific paths** in docs (replace with placeholders). README `git clone` URL should be your real repo.
- [ ] Remove or relocate **personal experiments** (`out/my-agent`, scratch files) before push.

## CI (strongly recommended)

- [ ] Add **`.github/workflows/ci.yml`**: `npm ci`, `npm run build`, `npm test` on Node 20 (and optionally 22).
- [ ] Fail PRs on **lint/format** if you add ESLint/Prettier later.
- [ ] (Optional) **Dependabot** for npm weekly updates.

## Documentation

- [ ] **README**: replace `git clone <repository-url>` with the real clone URL; add a **Screenshot** or short **asciicast** of the TUI (huge for discovery).
- [ ] Brief **“Limitations”** section: which [Google patterns](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system) share templates, what’s stub-only (Redis memory, some multi-agent patterns).
- [ ] **Contributing**: `CONTRIBUTING.md`—how to run tests, branch naming, that generated `dist/` is build output.
- [ ] **Security**: `SECURITY.md` with how to report vulnerabilities (GitHub can enable private reporting).

## Releases (optional but professional)

- [ ] Tag **`v0.1.0`** (or start at `v1.0.0` if you consider it stable).
- [ ] **GitHub Releases** notes: what the tool does, requirements (Node 20+, TTY).
- [ ] If **npm**: `npm publish` with `"files": ["dist", "templates", "README.md", "LICENSE"]` (and verify `templates` ship with the package—required at runtime).

## Product polish (optional)

- [ ] **`npm run prepack`** or **`prepare`** script that runs `npm run build` so consumers/installers get `dist/`.
- [ ] Smoke-test **global install**: `npm link` → `agent-tui create` in a real terminal.
- [ ] **Windows** note in README if you care: Ink/TTY/`/dev/tty` behavior differs; document WSL or known gaps.
- [ ] Align **version** in README badge or remove until you add badges.

## Honesty checklist (trust)

- [ ] README states that **generated apps** are **starters**, not production-hardened (tools, HTTP, `run_command`, etc.).
- [ ] **Claude spawn**: document that automation is best-effort (upstream spawn quirks).

---

When the **Legal**, **Hygiene**, **README accuracy**, and **CI** blocks are done, the repo is in good shape for a **public** launch. npm + Releases are optional follow-ups.
