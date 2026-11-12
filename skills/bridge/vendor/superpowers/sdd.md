# Subagent-Driven Development (controller)

You are the controller. Execute `openspec/changes/<id>/tasks.md` by dispatching a fresh implementer per task, a reviewer after each, and a final reviewer at the end. You coordinate; you never write product code or fix findings yourself (that pollutes your context and skips review).

Hand everything over as files. Whatever you paste into a dispatch, or a subagent prints back, stays in your context for the rest of the session. Narrate at most one line between tool calls.

**Continuous execution.** Do not pause between tasks. Stop only for: an irreversible or destructive operation; a security-sensitive action; a side effect outside the workspace (merge, push to a shared branch, publish); a plan so broken every path is a guess; or a cap below that says ask the human.

## Setup and preflight

1. Confirm the workspace (see worktree-and-finish.md). Never implement on main/master without the human's consent.
2. Check `bridge state <id>`. If it shows progress, go to Resume.
3. Record BASE: `git rev-parse HEAD`, then `bridge state <id> --set base=<sha>`.
4. Read tasks.md, proposal.md, design.md, and the delta spec paths once. The delta specs are the binding authority.
5. Preflight scan, once: for every pair of tasks sharing a file or interface, check what one produces against what the other consumes; for every task, check its test against its code and files. Rule on each conflict (specs win), and record each ruling as `bridge state <id> --set ruling.<n>="<decision> — <why> — <cost if wrong>"`. Clean scan: proceed without comment.

## Per task

**Batching:** several tiny same-shape edits (same one-line change across files) may go to one dispatch and one review. Anything needing its own judgment, tests, or review gets its own dispatch.

**Never** run implementers in parallel on overlapping files. When unsure, run serially.

### 1. Brief and dispatch

1. `task_base=$(git rev-parse HEAD)`; `bridge state <id> --set task.<n>.base=<task_base>`.
2. `bridge brief <id> <n>` prints the brief path.
3. Read the task's `Size:` line. `mechanical` → `bridge-mechanic`; `standard` or `complex` → `bridge-implementer`.
4. Dispatch with ONLY: the brief path, the change dir path (`openspec/changes/<id>/`), the report path (`.bridge/changes/<id>/reports/task-<n>.md`), and, if needed, one line on an earlier ruling or interface the brief cannot know. Never paste prior-task history or the whole plan.
5. Record the implementer's agent id: `bridge state <id> --set task.<n>.agent=<agentId>`.

Implementers never tick tasks.md, never update state, never spawn subagents.

### 2. Handle the report

Read the returned status block; open the report file only when needed.

- **DONE:** go to review.
- **DONE_WITH_CONCERNS:** read the concerns. Correctness or scope doubts: resolve them (resume the implementer) before review. Observations: note and review.
- **NEEDS_CONTEXT:** supply the missing context and resume or re-dispatch. A mechanic that needs judgment: re-dispatch to `bridge-implementer`.
- **BLOCKED:** change something. Context problem: more context, same model. Needs more reasoning: re-dispatch on a stronger model. Too large: split the task (edit tasks.md, record a ruling). Plan wrong: rule on the correction, record it, re-dispatch with it.

Never ignore an escalation or retry the same model unchanged.

### 3. Review

1. `bridge review-pkg <id> <task_base> HEAD` prints the diff path. Use the recorded task_base, never `HEAD~1`.
2. Dispatch `bridge-reviewer` with: diff path, brief path, report path, the delta spec paths in scope, and output path `.bridge/changes/<id>/reviews/task-<n>.md`.
3. Do not ask it to re-run tests the implementer ran, and never pre-judge findings ("do not flag X").
4. Read its last line. `VERDICT: APPROVE` with Spec and Quality both passing → complete. Anything else → fix loop. A review missing either verdict is invalid; re-dispatch.
5. "Cannot verify from diff" items: check them yourself; a real gap enters the fix loop.

Minor findings never enter the loop: record `bridge state <id> --set minor.<n>="<one-liner>"` for the final reviewer.

### 4. Fix loop (max 3 rounds per task)

A round is one fix dispatch plus one scoped re-review.

- **Rounds 1-2:** resume the same implementer (agent id from state) with the open Critical/Important findings verbatim. If resuming is impossible, dispatch fresh with brief, report path, and findings.
- **Round 3:** dispatch a fresh `bridge-implementer` on a stronger model (Claude Code: Agent tool `model: "opus"`), with brief, report path, findings, and: "A prior implementer attempted this twice; you own it now. Read the report file for what was tried."
- **Every round:** the implementer fixes, re-runs covering tests, appends a fix report to the same report file. Confirm it names tests, command, and output before re-review.
- **Re-review:** `bridge review-pkg <id> <previous_head> HEAD`; dispatch `bridge-reviewer` with the diff path, brief path, report path, the previous review path, and output path `.bridge/changes/<id>/reviews/task-<n>-round-<r>.md`. It verdicts each finding and checks only the fix diff.
- After each round: `bridge state <id> --set task.<n>.round=<r>`.
- **After round 3 with findings open:** stop and ask the human, with the open findings and your recommendation. Do not run a fourth round or silently discard findings.

### 5. Complete the task

Only after approval: tick `- [x] <n>` in tasks.md, `bridge state <id> --set task.<n>=done`, commit the tick with the task if the repo tracks openspec/. Never move on with open Critical/Important findings.

## After all tasks

1. `bridge guard verify <id>`. Fix what it reports via a fix dispatch, not by hand.
2. `bridge review-pkg <id> <base> HEAD` (base from state).
3. Dispatch `bridge-final-reviewer` on the most capable model with: diff path, change dir path, the delta spec paths, and output path `.bridge/changes/<id>/reviews/final.md`. Point it at the `minor.*` and `ruling.*` entries in state.json.
4. Findings: dispatch ONE `bridge-implementer` with the complete findings list (not one per finding), then one scoped re-review of the fix range.
5. **Verify→Build loop:** guard plus final review plus fix wave counts as one iteration. Maximum 3; then stop and ask the human.
6. Report every ruling you made, in order, with its cost if wrong, under "Rulings I made". Then proceed to finish.

## Resume

After compaction, trust files, not memory. Read only `.bridge/changes/<id>/state.json` and the checkboxes in tasks.md.

- Ticked and `task.<n>=done`: complete. Never re-dispatch.
- Has `task.<n>.round`: mid-loop; resume at the next round.
- Has `task.<n>.base` but no round: implementer may have committed; check `git log <task.<n>.base>..HEAD` and the report file, then review or re-dispatch.
- Otherwise start at the first unticked task.

## Red flags

| Thought | Reality |
|---|---|
| "I'll fix it myself, quicker" | Resume the implementer. Controller fixes skip review. |
| "Close enough on spec" | Spec gaps mean not done. |
| "Fix was tiny, skip re-review" | Unreviewed fixes are how regressions land. |
| "One more round will converge" | Cap is 3. Ask the human. |
