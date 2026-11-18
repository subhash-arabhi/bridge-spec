# Writing Plans

Write `openspec/changes/<id>/tasks.md` for an engineer who has not seen this codebase or this change. Assume they write idiomatic code once they know the exact interface and the exact test. What they cannot know is what you decided: which files, which names and signatures, which values from the spec, which tests prove each task. Write those down. DRY. YAGNI. TDD. Frequent commits.

Inputs: `proposal.md`, every `specs/<capability>/spec.md` delta, and the approved `design.md`. The delta specs are the binding authority; the plan argues from them.

## Scope check

If the change spans several independent subsystems, stop and propose splitting it into separate changes. Each change should produce working, testable software on its own.

## File structure first

Before writing tasks, map which files are created or modified and what each is responsible for.

- One clear responsibility per file, with a well-defined interface. Prefer small, focused files.
- Files that change together live together. Split by responsibility, not by layer.
- In existing code, follow established patterns. Do not restructure unilaterally.

## Task sizing

- A task is the smallest unit with its own test cycle that a reviewer could reject independently of its neighbours. Aim for 2-5 minutes of focused work.
- Fold setup, config, and docs into the task whose deliverable needs them.
- Each task ends with an independently testable deliverable and a commit.

## Format (contract)

```markdown
## 1. Storage layer
- [ ] 1.1 Add `expires_at` column to sessions table
  - Files: `db/migrations/20261112_sessions_expiry.sql`, `src/db/sessions.ts`
  - Test: `src/db/sessions.test.ts` — "rejects expired session"
  - Steps: write failing test → run (expect FAIL) → implement → run (expect PASS) → commit
  - Size: mechanical
  - Risk: low | standard | complex
```

- Group headings `## <n>. <name>`; tasks `- [ ] <group>.<n> <title>`; detail lines indented beneath. `bridge brief` extracts exactly one task plus its group heading, so each task must stand alone.
- **Files:** exact paths; for modifications, line ranges when known.
- **Test:** exact test file and test name, with the spec's exact values in the assertion where they matter. Name which `#### Scenario:` it proves.
- **Steps:** TDD sequence with the exact run command and expected result (FAIL with what message, then PASS). Add an extra indented line for the signature when a later task depends on it: `Interface: produces \`fn(a: A) -> B\` in <file>`.
- **Size:** `mechanical` = fully specified, no judgment (goes to `bridge-mechanic`); `standard` = some judgment within one area; `complex` = multi-file integration or design judgment.

## What a task contains

A task is done when the implementer can write exactly one reasonable thing from it: unambiguous, not complete.

- Test: name plus assertions with exact values.
- Code: exact signature, file, and spec-pinned values. Include a body only for an algorithm the signature and test do not determine.
- Verification: the command and the output that means it passed.
- Cross-task reference: point to the producing task's Interface line; do not repeat its code.

Forbidden lines that decide nothing: "TBD", "handle edge cases", "add appropriate validation", "write tests for the above", a type or function no task defines. A plan longer than the code it describes has written the code instead.

## Self-review checklist

Run it yourself after writing; fix inline.

1. **Scenario coverage:** for every `#### Scenario:` in every delta spec, point to at least one task whose Test proves it. Add a task for any gap.
2. **Requirement coverage:** every ADDED/MODIFIED requirement has an implementing task; every REMOVED requirement has a task that removes it and its tests.
3. **Step scan:** no line that decides nothing; no body the signature and test already determine.
4. **Consistency:** names, signatures, and types match across tasks (`clearLayers()` in 1.3 is not `clearFullLayers()` in 2.1).
5. **Failure modes:** list the inputs or conditions the specs imply but no test exercises that would most likely bite a user; add each test to the owning task.
6. **Format:** every task has Files, Test, Steps, Size; ids are unique and ordered.

Then run `bridge guard plan <id>` and fix whatever it reports.

## Handoff

Tell the human the plan is at `openspec/changes/<id>/tasks.md`, summarize task count and sizes, and ask them to review it before execution.

## Risk line (drives review cost)
Add `Risk: high` to tasks that touch auth, secrets, payments, schema or migrations, public API contracts, concurrency, or data deletion. Otherwise use `Risk: low`. High-risk and `Size: complex` tasks get their own review; low-risk tasks are reviewed in batches of up to 4. Mark honestly: under-marking saves tokens but risks bugs, and over-marking wastes tokens.
