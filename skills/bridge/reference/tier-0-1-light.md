# T0 / T1: light path

## T0 (trivial)
Make the edit. Run the project's existing lint/type/test command if one exists. Report what changed and the command result. No artifacts, no subagents.

## T1 (small change or bug)
1. **Bug?** Find the root cause before fixing: reproduce, read the error fully, trace back to the source. If you are unsure how, read `../vendor/superpowers/debugging.md`. After 3 failed fix attempts, stop and question the approach with the user.
2. **Failing test first** when the code is testable: write the smallest test that shows the bug or the new behavior, run it, see it fail for the expected reason. Then make it pass with the minimal change, then tidy. Full rules: `../vendor/superpowers/tdd.md` (read only if the user pushes back or you are tempted to skip).
   - Pure styling/markup with no test harness: say so and verify by running/building the app instead.
3. **Evidence before "done"**: run the tests/build and quote the relevant output lines. Never say "should work".
4. No OpenSpec, no plan file, no subagents, unless the next section applies.

## Spec delta (only when `bridge route` returned `spec_delta: true`)
The change alters a requirement already in `openspec/specs/`. Keep the living spec true:
1. `openspec new change <id>`; write a 3-line `proposal.md` (`## Why`, `## What Changes`) and a delta with `## MODIFIED Requirements` containing the full updated requirement + scenario.
2. `bridge guard open <id>`.
3. Do the T1 work. Write a one-task `tasks.md` and tick it.
4. `openspec archive <id> -y`.

## Escalate
Stop and re-route as T2 if you discover a public API, schema or cross-module change, or the user starts adding requirements.
