# Artifact map (single source of truth for paths)

OpenSpec owns the WHAT. Superpowers-derived steps own the HOW. Every HOW artifact lives
inside the OpenSpec change, so there is exactly one place to look.

| Concept | Path | Written by | Notes |
|---|---|---|---|
| Living requirements | `openspec/specs/<capability>/spec.md` | `openspec archive` only | Never hand-edit during a change |
| Change proposal (goal, scope) | `openspec/changes/<id>/proposal.md` | Open phase | Needs `## Why` and `## What Changes` |
| Delta specs (behavior, acceptance) | `openspec/changes/<id>/specs/<capability>/spec.md` | Open phase | `## ADDED/MODIFIED/REMOVED/RENAMED Requirements`; each `### Requirement:` has SHALL/MUST + ≥1 `#### Scenario:` with `- **WHEN**` / `- **THEN**` |
| Technical design (brainstorm output) | `openspec/changes/<id>/design.md` | Design phase | Replaces Superpowers `docs/superpowers/specs/*` |
| Implementation plan + completion record | `openspec/changes/<id>/tasks.md` | Plan phase; ticked only by the controller | Replaces Superpowers `docs/superpowers/plans/*` |
| Epic design doc (T3) | `docs/designs/<epic>.md` | Elephant | Living architecture doc, linked from each child proposal |
| Bridge state (per change) | `.bridge/changes/<id>/state.json` | `bridge state` | gitignored; resume point after compaction |
| Task brief | `.bridge/changes/<id>/briefs/task-<n>.md` | `bridge brief` | What the implementer reads |
| Implementer report | `.bridge/changes/<id>/reports/task-<n>.md` | implementer subagent | Status + evidence |
| Review package | `.bridge/changes/<id>/reviews/<base7>..<head7>.diff` | `bridge review-pkg` | What the reviewer reads |
| Review verdict | `.bridge/changes/<id>/reviews/task-<n>.md` | reviewer subagent | |
| Elephant decision log (T3) | `.bridge/epics/<epic>/elephant.md` | Elephant | Decisions + rejected alternatives |
| Goldfish reports (T3) | `.bridge/epics/<epic>/reviews/round-<r>/<role>.md` | goldfish subagents | |

## tasks.md format (OpenSpec-compatible checkboxes + bridge detail lines)

```markdown
## 1. Storage layer
- [ ] 1.1 Add `expires_at` column to sessions table
  - Files: `db/migrations/20261112_sessions_expiry.sql`, `src/db/sessions.ts`
  - Test: `src/db/sessions.test.ts` — "rejects expired session"
  - Steps: write failing test → run (expect FAIL) → implement → run (expect PASS) → commit
  - Size: mechanical | standard | complex
```

- Task ids are `<group>.<n>`. `bridge brief` extracts one task (its line + indented lines) plus its group heading.
- `Size:` drives the implementer model (mechanical → `bridge-mechanic`, standard/complex → `bridge-implementer`).
- Only the controller (main session) ticks `- [x]`, after the reviewer approves.

## CLI

All scripted steps go through `bridge` (on PATH; fallback `node ~/.claude/skills/bridge/bin/bridge.mjs`):

```
bridge route '<slot-json>'                 → tier + reason (JSON)
bridge state <id> [--set k=v ...]          → read/update .bridge/changes/<id>/state.json
bridge brief <id> <task-id>                → writes briefs/task-<task-id>.md, prints path
bridge review-pkg <id> <base> [head]       → writes reviews/<base7>..<head7>.diff, prints path
bridge guard <open|plan|verify> <id>       → exit 0 = phase may advance; prints failures otherwise
bridge doctor                              → install health
```
