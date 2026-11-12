# Model policy

The session model (whatever the user picked) does routing, brainstorming dialogue, the elephant role and controller work. Delegated work runs on the model set in each agent's frontmatter (generated from `config/models.json` in the bridge repo):

| Agent | Default (Claude) | Used for |
|---|---|---|
| `bridge-explorer` | haiku | Read-only codebase recon before brainstorming or design; returns a compact file map |
| `bridge-mechanic` | haiku | Tasks with `Size: mechanical` (plan already holds the code) |
| `bridge-implementer` | sonnet | `Size: standard` / `complex` tasks, fix rounds 1–2 |
| `bridge-reviewer` | sonnet | Per-task spec-compliance + quality review (never below mid tier) |
| `bridge-final-reviewer` | opus | Whole-change review before archive |
| `bridge-goldfish` | opus | Fresh-context design review (T3); pass model "sonnet" for comprehension/style roles |

Escalation: fix round 3 re-dispatches `bridge-implementer` with model override `opus` (Claude Agent tool `model` parameter; in Cursor pick the stronger model if the tool allows, otherwise ask the user).

Cost rules:
- Prefer `bridge-mechanic` whenever the task text already contains the exact code and test.
- Use `bridge-explorer` instead of reading many files in the main session; ask it for paths and a ≤300-word map.
- Do not run reviewers on T0/T1 work.
- If the session model is already the strong model, still dispatch implementers on their configured models.
