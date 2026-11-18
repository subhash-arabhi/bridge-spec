# Artifact map (single source of truth for paths)

OpenSpec owns the WHAT. Superpowers-derived steps own the HOW. Every HOW artifact lives
inside the OpenSpec change, so there is exactly one place to look.

| Concept | Path | Written by | Notes |
|---|---|---|---|
| Living requirements | `openspec/specs/<capability>/spec.md` | `openspec archive` only | Never hand-edit during a change |
| Change proposal (goal, scope) | `openspec/changes/<id>/proposal.md` | Open phase | Needs `## Why` and `## What Changes` |
| Delta specs (behavior, acceptance) | `openspec/changes/<id>/specs/<capability>/spec.md` | Open phase | `## ADDED/MODIFIED/REMOVED/RENAMED Requirements`; each `### Requirement:` has SHALL/MUST + ≥1 `#### Scenario:` with `- **WHEN**` / `- **THEN**` |
| Technical design (only when needed) | `openspec/changes/<id>/design.md`, else `## Approach` in proposal.md | Clarify step | ≤ ~80 lines; `design=auto` decides |
| Implementation plan + completion record | `openspec/changes/<id>/tasks.md` | Plan phase; ticked only by the controller | Replaces Superpowers `docs/superpowers/plans/*` |
| Repo context for fresh agents | `ARCHITECTURE.md` (repo root) | `bridge-cartographer` | Structure, design, run commands, published resources, env variable **names**; see `architecture-doc.md` |
| Epic design doc (T3) | `docs/designs/<epic>.md` | Elephant | Living architecture doc, linked from each child proposal |
| Bridge state (per change) | `.bridge/changes/<id>/state.json` | `bridge state` | gitignored; resume point after compaction |
| Task brief | `.bridge/changes/<id>/briefs/task-<n>.md` | `bridge brief` | What the implementer reads |
| Implementer report | `.bridge/changes/<id>/reports/task-<n>.md` | implementer subagent | Status + evidence |
| Review package | `.bridge/changes/<id>/reviews/<base7>..<head7>.diff` | `bridge review-pkg` | What the reviewer reads |
| Review verdict | `.bridge/changes/<id>/reviews/task-<n>.md` or `batch-<first>-<last>.md` | reviewer subagent | |
| Elephant decision log (T3) | `.bridge/epics/<epic>/elephant.md` | Elephant | Decisions + rejected alternatives |
| Goldfish reports (T3) | `.bridge/epics/<epic>/reviews/round-<r>/<role>.md` | goldfish subagents | |

## tasks.md format (vertical slices, ≤ 6 detail lines)

```markdown
## 1. Session expiry
- [ ] 1.1 Reject expired sessions end to end
  - Files: `db/migrations/20261112_expiry.sql`, `src/db/sessions.ts`
  - Spec: Session expiry; Expired session rejected
  - Test: `src/api/auth.test.ts` — "rejects expired session"
  - Size: standard
  - Risk: high
  - Depends: 1.0   (optional)
```

- Ids are `<group>.<n>`. `bridge brief` extracts one slice and quotes the requirements named in Spec (or matched by scenario names in Test), plus optional `Design:` sections.
- `Files` drive the parallel waves (`bridge waves`). `Size: mechanical` can go to `bridge-mechanic`.
- `Size: complex` or `Risk: high` → reviewed on its own; everything else relies on tests and the final review (`review_mode=lean`).
- Only the controller ticks `- [x]`.

## CLI

All scripted steps go through `bridge` (on PATH; fallback `node ~/.claude/skills/bridge/bin/bridge.mjs`):

```
bridge route '<slot-json>'                 → tier + reason (JSON)
bridge state <id> [--set k=v ...]          → read/update .bridge/changes/<id>/state.json
bridge brief <id> <task-id>                → writes briefs/task-<task-id>.md, prints path
bridge review-pkg <id> <base> [head] [--final] → lean diff (-U3, no lockfiles; --final also drops tests), prints path + changed_lines
bridge review-plan <id> [--mode=lean|risk|every-task] → solo / batched / skipped reviews (default lean)
bridge guard <open|plan|verify> <id>       → exit 0 = phase may advance; prints failures otherwise
bridge env-keys                            → env variable NAMES per .env* file (never values)
bridge scenarios <id>                      → scenario coverage checklist for the final review
bridge waves <id>                          → parallel waves of open slices
bridge workflow                            → effective workflow settings
bridge doctor                              → install health
```
