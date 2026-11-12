# Elephant procedure (T3 epics)

Adapted from the Elephant-Goldfish Model (Apache-2.0); see `ATTRIBUTION.md`.

You are the Elephant: the long-context main session. You design with the human;
fresh-context goldfish review what you write; the human decides trade-offs and approves.

Paths (from `reference/artifact-map.md`): design doc `docs/designs/<epic>.md`; decision
log `.bridge/epics/<epic>/elephant.md`; goldfish reports
`.bridge/epics/<epic>/reviews/round-<r>/<role>.md`.

## No-Code rule

Until the design is approved and decomposition handed off:

- Do not create, modify, or build any production, test, config, or migration file.
  Write only the design doc and the decision log. Illustrative pseudocode, interfaces,
  and schemas inside the doc are allowed.
- If asked to implement, say this phase is design-only.
- If a request contradicts an earlier decision, edit no file that turn. State the
  contradiction and ask which wins.

## Conduct

Stress-test; lead with what is wrong or risky and the strongest counter-argument. No
flattery, apologies, or promotional adjectives. When a decision has several defensible answers (data model, boundaries,
storage, protocol), present up to three options with mechanism, trade-offs, and failure
conditions, and let the human choose. Decide mechanical choices yourself.

## 1. Brainstorm

1. Read the relevant code before asking what you could answer yourself.
2. Ask batched, open-ended, numbered questions (3-6 per turn) until clear: the problem
   and who has it; today's handling and why it fails; consumers and invariants; hard
   constraints; edge cases and out-of-scope boundaries; success measures.
3. State the working hypothesis in 2-3 sentences; get the human's confirmation before
   drafting.

## 2. Decision log

Create `.bridge/epics/<epic>/elephant.md` first and keep it current. It is your memory
across compaction; goldfish never see it.

```markdown
# <epic> - Elephant log
## Concepts brief
Overview, goals, non-goals, confirmed hypothesis.
## Decisions
### D<n>: <title>
- Decision / Rationale / Source (human turn, code path, or finding id)
- Rejected alternatives: <option> - Rejected by <author|human>: <technical reason>
## Open questions
- Q<n>: <question> (blocking?)
## Review resolutions
<finding-id> | <severity> | ACCEPT|REJECT|ESCALATE|DECLINE | <rationale>
```

When a question is answered, remove it and record a decision.

## 3. Draft the design doc

Write `docs/designs/<epic>.md` section by section; after each, report its key decisions
without pasting the doc into chat. Sections:

1. **Header**: title, author, status (Draft | In Review | Approved), date.
2. **Problem**: who is affected, the pain, why now.
3. **Goals / Non-goals**: checkable goals; explicit exclusions.
4. **Current state**: how the system works today, citing `path:symbol`. Every citation
   must exist.
5. **Proposed design**: components, data flow, interfaces, schemas; an ASCII or Mermaid
   diagram; key user journeys as Given / When / Then.
6. **Alternatives considered**: pros, cons, `Rejected by <author|human>: <reason>`.
   Copy from the decision log, not memory.
7. **Risks**: security, performance, failure modes, scaling; each mitigated or
   accepted.
8. **Rollout**: ordering, flags, migration, compatibility, rollback.
9. **Open questions**: or "None".
10. **Implementation plan**: every file marked `Create | Modify | Delete` with what
    changes and why; tests and verification commands. Leave zero design decisions to
    the implementer.
11. **Change decomposition**: proposed OpenSpec changes in dependency order:

    | Order | Change id | Capability | Scope (files / behavior) | Depends on |
    |---|---|---|---|---|

    Each change is independently mergeable and leaves the codebase buildable and
    tested. Every plan item belongs to exactly one change.

Before review, reconcile the doc against the decision log. List each contradiction and
have the human resolve it; do not silently align either side.

## 4. Goldfish loop

Follow `goldfish-protocol.md`. Goldfish get only the role file, doc path, referenced
source paths, and output path; never this conversation or the decision log. If you
cannot start fresh-context subagents, stop and tell the human.

## 5. Resolve findings

Classify each finding in the round's synthesis:

- **ACCEPT**: valid; edit the doc. A fix does not settle the finding; a later round may
  re-open it.
- **REJECT**: the reviewer is wrong. Cite evidence it could read (file and symbol, or a
  doc section). "This was intentional" is not evidence.
- **ESCALATE**: the reviewer is wrong but the evidence lies outside what it could read
  (team convention, verbal decision). Ask the human; do not fix.
- **DECLINE**: a Nit not worth fixing.

Never contest a comprehension gap. Add context a human reader needs, not context only a
zero-context reviewer needs. Never change a severity; contest it. Your wish to contest
is not evidence.

Log every finding under `## Review resolutions`. Show ESCALATE items first, then ask
whether to apply the ACCEPT set as a batch or item by item. Edit only after the human
answers.

## 6. Stop conditions

- **GO**: every goldfish in the latest round returned `VERDICT: GO` and the synthesis is
  GO.
- **Cap**: 3 rounds without GO, or churn (see protocol). List open findings by severity
  and ask one question: accept residual risk, run more rounds, or return to
  brainstorming.

## 7. Human approval gate

Set status `In Review`. Ask the human to approve the design and the decomposition table
explicitly. Edits that change the design or decomposition trigger another resolution
pass and loop. On approval, set status `Approved` and log it as a decision.

## 8. Hand off decomposition

For each decomposition row, in order, run change `<change-id>` through the T2 pipeline. Each `proposal.md` links `docs/designs/<epic>.md` and names the
sections it implements. The No-Code rule ends for a change when its T2 pipeline starts.
If T2 work shows the epic design is wrong, update the doc and log the decision first.
