# ARCHITECTURE.md: the one-file context for a fresh agent

Every repo the bridge works in keeps one file at the root, `ARCHITECTURE.md`; if a differently cased `Architecture.md` already exists, use that. A new agent should be able to read it first and know where everything is without crawling the code. It is maintained by the `bridge-cartographer` subagent (small model), never written at length by the main session.

## Required sections (keep the whole file ≤ ~400 lines)
1. **Purpose**: 2–4 sentences on what the system does and for whom.
2. **Run it**: install, dev, test, build and deploy commands, copied exactly from package.json, pyproject.toml, Makefile or CI.
3. **File structure**: a tree of the top 2–3 levels, with a one-line role for each meaningful directory or entry file. Skip generated, vendored and cache dirs.
4. **Design**: the main components, how data and control flow between them, key patterns and conventions, and external services. Add a mermaid diagram only if it adds clarity.
5. **Specs and decisions**: pointers to `openspec/specs/` (list the capabilities), `docs/designs/*.md`, and ADRs if present.
6. **Resources and where they are published**: deployment targets (hosts, projects, buckets, registries, dashboards, docs sites) as `name → URL or identifier → what it is`. Only include what the repo, its config or the user states. Never guess.
7. **Configuration and secrets**: environment variable **names only**, grouped by file (`.env.local`, `.env.example`, CI secrets), each with its purpose and where it is used (file:symbol). Get the names from `bridge env-keys`.
8. **Gotchas**: non-obvious constraints, known issues, and things that look wrong but are intentional.
9. **Last updated**: the date plus the short git sha the doc was checked against.

## Hard rules
- **Never write a secret value**: not a key, token, password, connection string or private URL with credentials. Do not open `.env*` files directly; use `bridge env-keys`, which prints only names. If a value appears anywhere you read, leave it out.
- Facts only, each one traceable to a file. Mark anything unverified with `(unverified)`.
- Update in place. Keep sections the user wrote by hand, and change only the parts that are stale.

## When to create or update it
- **Session start in a repo:** if the file exists, read it before exploring the code. If it is missing and the task is T1 or larger, dispatch the cartographer in `create` mode first; this also makes later recon cheaper.
- **After any change that alters** the structure (new or moved dirs or entry points), commands, external services or resources, or env variable names: dispatch the cartographer in `update` mode, giving it the diff range.
- **T2:** always run it at the Archive step, before the finish-branch step, and commit the result with the archive.
- **T3:** run it after the design doc is approved, so Design and Specs point at `docs/designs/<epic>.md`, and again after each child change is archived.
- **T0:** skip it, unless the edit changed an env variable name, a command or a resource.

## How to dispatch
Use the `bridge-cartographer` agent with: mode (`create` | `update`), repo root, diff range for updates (`<base>..HEAD`), and any facts the user gave in chat, such as where something is deployed. It returns a ≤5-line summary. Do not paste the doc back into the main session.
