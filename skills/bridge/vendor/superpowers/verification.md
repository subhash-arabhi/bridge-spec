# Verification Before Completion

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you have not run the command in this turn, you cannot claim it passes.

## Gate

Before claiming any status, ticking a task, committing, or reporting DONE:

1. **Identify** the command that proves the claim.
2. **Run** it fully and fresh.
3. **Read** the whole output: exit code, failure count, warnings.
4. **Compare:** does the output confirm the claim? If not, report the actual state with evidence.
5. Only then make the claim, quoting the command and an output excerpt.

## What counts

| Claim | Requires | Not enough |
|---|---|---|
| Tests pass | Test command output, 0 failures | An earlier run, "should pass" |
| Build succeeds | Build command, exit 0 | Linter passing |
| Bug fixed | Original symptom re-tested | Code changed |
| Regression test works | Red-green observed (revert fix: fails; restore: passes) | Passed once |
| Subagent finished | `git log`/diff shows the change | Its report says so |
| Requirements met | Each scenario in the delta specs checked | Tests green |
| Phase may advance | `bridge guard <phase> <id>` exits 0 | Your judgment |

## Red flags: stop and run the command

- "Should", "probably", "seems to"
- Saying "Done", "Great", "Fixed" before running anything
- Trusting an agent's success report without checking the diff
- Partial checks ("ran one test file")
- About to commit, tick, or open a PR without fresh output
