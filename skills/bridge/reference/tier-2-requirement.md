# T2 / T2-lite: requirement pipeline (WHAT → HOW → archive)

Settings come from `bridge workflow` (defaults: `execution=native`, `task_size=slice`, `review_mode=lean`, `design=auto`, `gates=combined`, `brainstorm_rounds=1`, `parallel=true`). Read them once at the start. Change id: a short kebab-case verb phrase (`add-session-expiry`). Record progress with `bridge state <id> --set ...`; the guards record `phase_passed` themselves.

**T2-lite** (from `bridge route`: small, one module, no API, schema or cross-module change) uses the same steps with less: no design.md, 1–3 slices, built inline, and one final review on the reviewer model.

## 0. Setup (first T2 in a repo only)
If `openspec/` is missing: `openspec init --tools none --no-animation`, then copy `~/.claude/skills/bridge/templates/openspec-config.yaml` over `openspec/config.yaml`. Make sure `.bridge/` is in `.gitignore`. Read ARCHITECTURE.md; use `bridge-explorer` only for areas it doesn't cover.

## 1. Open: WHAT (minimal OpenSpec)
1. `openspec new change <id>`; `bridge state <id> --set tier=<T2|T2-lite>`.
2. `proposal.md` (cap ~20 lines): `## Why` (2–3 lines) and `## What Changes` (bullets plus an out-of-scope line). When `design=auto` and no design.md is needed, add `## Approach` with 3–8 lines of key decisions.
3. Delta specs `specs/<capability>/spec.md`: one SHALL/MUST sentence per `### Requirement:`, with 1–2 `#### Scenario:` (WHEN/THEN), only for behavior that matters. No prose sections. MODIFIED holds the full new text. Check existing specs with `openspec list --specs`.
4. `bridge guard open <id>` must exit 0 (warnings flag oversized docs; fix them).

## 2. Clarify and approve (one gate)
- Follow `../vendor/superpowers/brainstorming.md` with at most `brainstorm_rounds` question rounds. If the request is unambiguous, ask nothing: list your assumptions.
- **design.md only when needed** (`design=auto`): data model or schema changes, public API, security, concurrency, cross-module flow, or more than 3 slices. It is capped at ~80 lines: decisions, alternatives rejected, risks. Otherwise the Approach section in the proposal is enough.
- **One approval** (`gates=combined`): show the user in one message the why, the scenarios (one line each), the approach or design decisions, and your assumptions. Ask a single yes/adjust question. With `gates=separate`, approve the proposal first and the design second.

## 3. Plan
Read `../vendor/superpowers/writing-plans.md`. `tasks.md` holds **vertical slices** (`task_size=slice`): each is about 15–30 minutes of work with ≤ 6 short detail lines (Files, Spec, Test, Size, Risk, and Depends if needed). No step-by-step instructions. Every scenario maps to a slice's Test or Spec line. `bridge guard plan <id>` must exit 0.

## 4. Build
1. Isolation: offer a worktree (`../vendor/superpowers/worktree-and-finish.md`, Start section); respect a "no".
2. `bridge state <id> --set base=$(git rev-parse HEAD)`. Set `test_cmd` if it can't be auto-detected.
3. **`execution=native` (default):** build the slices yourself in this session, one at a time, strict TDD (`../vendor/superpowers/tdd.md` if you need the rules).
   - For each slice: write the failing tests for its scenarios, implement, then run the **full** test suite and lint (not only the new tests). Commit, then tick the slice.
   - **Parallel** (`parallel=true`): run `bridge waves <id>`. When a wave has 2 or more slices, build one yourself and give each of the others to a `bridge-implementer` (`bridge-mechanic` for `Size: mechanical`), passing `bridge brief <id> <task>` output. The brief already quotes the matching requirements. Merge their reports when the wave finishes.
   - **Risk review:** after each slice that `bridge review-plan <id>` lists as `solo` (complex or high risk), run one `bridge-reviewer` on `bridge review-pkg <id> <slice_base> HEAD`. Do not review other slices individually.
4. **`execution=delegated`:** follow `../vendor/superpowers/sdd.md` (one implementer per task, review plan, fix loop). Use it for very large changes or weaker models.
5. If a slice reveals the plan was wrong, update tasks.md, record `bridge state <id> --set ruling.<n>="..."`, and continue.

## 5. Verify
1. `bridge guard verify <id>`: all slices ticked, `openspec validate --strict`, tests green.
2. `bridge scenarios <id>` writes the scenario checklist. `bridge review-pkg <id> <base> HEAD --final` writes the lean final diff (no tests or lockfiles).
3. Dispatch `bridge-final-reviewer` with: the final diff, the checklist, the change dir, any solo review verdicts, and `minor.*`/`ruling.*` from state. Model: the agent default when the diff has more than ~600 `changed_lines` or any slice was high risk; otherwise the reviewer model (Claude Code: override `sonnet`). T2-lite always uses the reviewer model.
4. Fix all findings in one pass (natively, or with one implementer under `delegated`), then one scoped re-review of the fix range. Verify→fix happens at most 3 times; then ask the user.

## 6. Archive and finish
1. `openspec archive <id> -y`: the deltas merge into `openspec/specs/`.
2. `bridge-cartographer` (`update`, range `<base>..HEAD`). Commit ARCHITECTURE.md together with the archive.
3. Finish the branch (`../vendor/superpowers/worktree-and-finish.md`, Finish section).
4. Report to the user in ≤ 8 lines: requirements added or changed, tests added, commits, rulings, anything deferred.
