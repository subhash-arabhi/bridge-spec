# Attribution

The files in this directory are derived from the Elephant-Goldfish Model (EGM).

- Source repository: https://github.com/google/elephant-goldfish-model
- Version: v0.1.1
- Commit: 0997679a1cc3cfe09206160a85f9379f47101053
- License: Apache License 2.0 (copied verbatim in `LICENSE`)
- NOTICE: the upstream repository contains no NOTICE file at this commit.

## Files and their sources

| File here | Derived from (upstream) |
|---|---|
| `elephant.md` | `skills/egm-brainstorm/SKILL.md`, `skills/egm-draft/SKILL.md`, `skills/egm-draft/references/design_doc.md`, `skills/egm-resolve/SKILL.md`, `resources/execution_instructions.md` |
| `goldfish-protocol.md` | `skills/egm-review/SKILL.md`, `skills/egm-review-loop/SKILL.md`, `agents/synthesizer.md`, `README.md` |
| `roles/comprehension.md` | `agents/comprehension.md`, `.claude-plugin/agents/comprehension.md` |
| `roles/design_critic.md` | `agents/design_critic.md`, `resources/document_standards/feature-spec-standard.md` |
| `roles/implementation_readiness.md` | `agents/implementation_readiness.md`, `resources/document_standards/implementation-readiness-standard.md` |
| `roles/structural.md` | `agents/structural.md`, `skills/egm-draft/references/design_doc.md` |
| `roles/zoom_out.md` | `agents/zoom_out.md`, `resources/document_standards/zoom-out-standard.md` |
| `roles/codebase_details.md` | `agents/codebase_details.md` |
| `roles/synthesizer.md` | `agents/synthesizer.md` |
| `../../../../agents/templates/bridge-goldfish.md` | `.claude-plugin/agents/*.md` (shared goldfish mandates) |

## Modifications

Modified: trimmed, paths adapted; see NOTICE requirements of Apache-2.0.

- Trimmed to protocol substance: removed install and marketplace material, platform
  adapters, structured-question gate payloads, telemetry, test harness, bootstrap and
  drift-report skills, and BRAINSTORM mode of the reviewer personas.
- Paths adapted to bridge's artifact map: `concepts_brief.md` became a section of
  `.bridge/epics/<epic>/elephant.md`; `design_draft.md` and the `docs/designs` save
  flow became `docs/designs/<epic>.md`; review reports moved to
  `.bridge/epics/<epic>/reviews/round-<r>/<role>.md`.
- Adapted workflow: batched brainstorm questions, a change-decomposition section in
  the design doc, `VERDICT: GO | NO_GO` lines, a 3-round cap, and a hand-off to
  OpenSpec changes.
