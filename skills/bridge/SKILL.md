---
name: bridge
description: Engineering workflow router for coding work that is bigger than a quick edit. Use when the user gives a requirement, spec, ticket or feature request; when a change adds a capability or touches a public API, DB schema or several modules; when designing a large system or workflow; when resuming an openspec/changes/ change; or when the user says "spec it", "full workflow", "epic" or "bridge". Routes the work to OpenSpec (requirements, delta specs, archive), Superpowers-style TDD with implementer/reviewer subagents, or Elephant-Goldfish design review. Skip it for trivial edits and small fixes.
---

# Bridge

OpenSpec owns **WHAT** (living requirements, delta specs, archive). Superpowers-derived steps own **HOW** (bounded brainstorming, strict TDD, isolated implementer/reviewer subagents). Elephant-Goldfish (EGM) owns **very large design**. All paths are in `reference/artifact-map.md`. CLI: `bridge` (fallback `node ~/.claude/skills/bridge/bin/bridge.mjs`).

Token rule: read only the files named for the tier you are on, and only when you reach that step. Hand subagents file paths, never conversation history.

## 1. Route (always first)

Check for work in progress: `ls openspec/changes 2>/dev/null` (ignore `archive/`). If the request continues one, set `active_change`.

Fill this frame from the request and a quick look at the code. Booleans default to false. Do not guess; if a slot needs a fact, check the code.

```json
{"trivial":false,"existing_behavior":false,"new_capability":false,"public_api_change":false,
 "schema_change":false,"cross_module":false,"multi_capability":false,"architecture":false,
 "explicit_requirement":false,"touches_specced_requirement":false,"ambiguity":"low",
 "est_files":1,"user_override":null,"active_change":null}
```

- `new_capability`: behavior a requirement would describe that does not exist yet. A small UI addition inside an existing feature is `existing_behavior`, not new.
- `explicit_requirement`: the user handed over a requirement, PRD, ticket or acceptance criteria.
- `user_override`: `"light"` ("just do it"), `"full"` ("spec it"), `"epic"` ("design it properly"), or null.

Run `bridge route '<frame>'`. The script decides. Tell the user the tier and reason in one line, then follow it. The user can override at any time.

## 2. Follow the tier

| Tier | Load | Summary |
|---|---|---|
| T0 | nothing | Edit, run existing checks, done. |
| T1 | `reference/tier-0-1-light.md` | TDD-lite, root cause for bugs, evidence before "done". |
| T2 | `reference/tier-2-requirement.md` | Open → Design → Plan → Build → Verify → Archive. |
| T3 | `reference/tier-3-epic.md` | Elephant design → goldfish review → split into T2 changes. |
| resume | `reference/recovery.md` | Continue from `.bridge/changes/<id>/state.json`. |

If `spec_delta: true` comes back for T1, also add a minimal OpenSpec delta and archive it (see tier-0-1-light.md).

## 3. Escalate, never silently downgrade

- If T1 work turns out to touch a public API, schema or several modules: stop, say so, re-route as T2.
- If a T2 design shows several capabilities or unresolved architecture: propose T3.
- Never drop an active change to a lower tier without the user saying so.

## 4. Models

Subagents carry their own models (`reference/model-policy.md`); the session model is unchanged. Agents: `bridge-explorer`, `bridge-mechanic`, `bridge-implementer`, `bridge-reviewer`, `bridge-final-reviewer`, `bridge-goldfish`.

## Hard rules

- No production code before a failing test, unless the user explicitly waives it for this task.
- No completion claim without the command output that proves it.
- Phase changes only after `bridge guard <phase> <id>` exits 0.
- Only the controller (this session) ticks `tasks.md`.
- Implementers and reviewers never see chat history.
