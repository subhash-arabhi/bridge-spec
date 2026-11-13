# T2: requirement pipeline (WHAT → HOW → archive)

Change id: short kebab-case verb phrase (`add-session-expiry`). After each step, record progress with `bridge state <id> --set ...`; the guards record `phase_passed` themselves.

## 0. Setup (first T2 in a repo only)
If `openspec/` is missing: `openspec init --tools none --no-animation` (CLI only: no OpenSpec skills get installed, so no extra context). Then copy `~/.claude/skills/bridge/templates/openspec-config.yaml` over `openspec/config.yaml`. Make sure `.bridge/` is in `.gitignore`.

## 1. Open: WHAT (OpenSpec)
1. Broad or unfamiliar code: dispatch `bridge-explorer` for a file map first. Do not read many files yourself.
2. `openspec new change <id>`; `bridge state <id> --set tier=T2`.
3. Write `proposal.md`: `## Why`, `## What Changes`, out-of-scope line, affected capabilities.
4. Write delta specs `specs/<capability>/spec.md`, using `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`. Each `### Requirement:` is one SHALL/MUST sentence with ≥1 `#### Scenario:` (`- **WHEN**` / `- **THEN**`). MODIFIED holds the full new text. Check existing specs with `openspec list --specs` / `openspec show <spec>`.
5. `bridge guard open <id>` must exit 0. Show the user the proposal and scenarios in a short summary and get a yes. The requirements are the contract: everything after this traces back to a scenario.

## 2. Design: HOW (bounded brainstorming)
Read `../vendor/superpowers/brainstorming.md` and follow it. Output: `openspec/changes/<id>/design.md`. At most 3 batched question rounds. Get approval before planning. If the design reveals several capabilities or open architecture questions, propose T3.

## 3. Plan
Read `../vendor/superpowers/writing-plans.md`. Output: `openspec/changes/<id>/tasks.md` in the contract format (Files/Test/Steps/Size per task). Every scenario must map to a task's Test line. `bridge guard plan <id>` must exit 0.

## 4. Build
1. Isolation: read `../vendor/superpowers/worktree-and-finish.md` (Start section). Offer a worktree; respect a "no".
2. Record base: `bridge state <id> --set base=$(git rev-parse HEAD)`. Set `test_cmd` if it can't be auto-detected.
3. Read `../vendor/superpowers/sdd.md` and run its per-task loop: `bridge brief` → implementer (`bridge-mechanic` for `Size: mechanical`, else `bridge-implementer`) → report → `bridge review-pkg` → `bridge-reviewer` → fix loop (max 3, round 3 on opus) → controller ticks the task.
4. Small changes (≤3 mechanical tasks, one module): you may run the tasks inline in this session with the same TDD rules, then do one review of the whole diff with `bridge-reviewer`. Say that you are doing this.

## 5. Verify
`bridge guard verify <id>` (all tasks ticked, `openspec validate --strict`, tests green). Then `bridge review-pkg <id> <base> HEAD` → `bridge-final-reviewer` against proposal + all delta specs + design. Fix findings via the Build loop. Verify→Build at most 3 times, then ask the user.

## 6. Archive and finish
1. `openspec archive <id> -y`: the deltas merge into `openspec/specs/`, and the change moves to `changes/archive/`.
2. Dispatch `bridge-cartographer` in `update` mode (in `create` mode if the file is missing) with range `<base>..HEAD`. Commit ARCHITECTURE.md together with the archive.
3. Finish the branch per `../vendor/superpowers/worktree-and-finish.md` (Finish section): verify tests, offer merge / PR / keep / discard.
4. Report to the user: requirements added or changed, tests added, commits, anything deferred.
