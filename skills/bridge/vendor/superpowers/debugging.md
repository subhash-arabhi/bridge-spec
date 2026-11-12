# Systematic Debugging

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Use for any test failure, bug, build failure, or unexpected behaviour, especially under time pressure or after a fix already failed. Symptom fixes are failure. Complete each phase before the next.

## Phase 1: Root cause

1. **Read the error fully.** Whole stack trace, line numbers, codes. It often names the answer.
2. **Reproduce reliably.** Exact steps. Not reproducible: gather more data; do not guess.
3. **Check recent changes.** `git diff`, recent commits, new dependencies, config, environment.
4. **Multi-component systems:** before proposing fixes, instrument each boundary (what enters, what exits, config propagation). Run once to see where it breaks, then investigate that component.
5. **Trace data flow backward.** Where does the bad value originate? What called this with it? Keep going up until you find the source. Fix at the source.

## Phase 2: Pattern

1. Find similar working code in the same codebase.
2. If following a reference implementation, read it completely.
3. List every difference between working and broken, however small.
4. Identify the dependencies, config, and assumptions involved.

## Phase 3: Hypothesis

1. State one hypothesis: "X is the root cause because Y." Write it down.
2. Test it with the smallest possible change, one variable at a time.
3. Confirmed: Phase 4. Not confirmed: form a new hypothesis; do not stack fixes.
4. Do not understand something? Say so and research or ask.

## Phase 4: Fix

1. Write a failing test reproducing the bug (see tdd.md).
2. Implement one fix addressing the root cause. No "while I'm here" changes.
3. Verify: test passes, full suite passes, original symptom gone (see verification.md).
4. Fix did not work: count attempts. Fewer than 3: return to Phase 1 with the new information.

## Three failed fixes: question the architecture

If 3 fixes have failed, stop. Signs of a wrong architecture: each fix reveals new coupling elsewhere, fixes need large refactors, each fix creates new symptoms. Do not attempt fix 4. Ask whether the pattern is sound, then discuss with the human (or, as a subagent, report BLOCKED with what you tried).

## Truly environmental

If investigation shows the cause is external or timing-dependent: document what you checked, add appropriate handling (retry, timeout, clear error), and add logging. Most "no root cause" conclusions are incomplete investigations; be sure.

## Red flags: return to Phase 1

- "Quick fix now, investigate later"
- "Just try changing X"
- Several changes at once, then run the tests
- "It's probably X" without evidence
- Listing fixes before tracing data flow
- "One more attempt" after 2 failures
- Human says "stop guessing" or "is that actually happening?"
