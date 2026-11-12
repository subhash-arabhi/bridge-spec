# Test-Driven Development

Write the test first. Watch it fail. Write minimal code to pass. If you did not watch the test fail, you do not know it tests the right thing.

Applies to new features, bug fixes, refactors, and behaviour changes.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before the test? Delete it and start over. Do not keep it as reference, do not adapt it while writing tests, do not look at it. Implement fresh from the test.

## Red-Green-Refactor

**RED: write one failing test.**
- One behaviour; if the name needs "and", split it.
- Clear name that describes the behaviour.
- Real code; mocks only when unavoidable. Assert on real behaviour, never on mock behaviour.
- Before writing it, name the production change that would make it fail.

**Verify RED (mandatory).** Run the focused test. Confirm:
- It fails (not errors).
- The failure message is the expected one.
- It fails because the feature is missing, not because of a typo.

Test passes immediately? It tests existing behaviour; fix the test. Test errors? Fix the error and re-run until it fails correctly.

**GREEN: minimal code.** The simplest code that passes. No extra options, no refactoring elsewhere, no "improvements" beyond the test.

**Verify GREEN (mandatory).** Run the test, then the project's full test command once before you call the change done. Confirm all pass and output is pristine (no errors or warnings). Test fails? Fix the code, not the test. Any failure in the full run, including one you did not cause, goes in your report by name.

**REFACTOR.** Only when green: remove duplication, improve names, extract helpers. Stay green. Add no behaviour.

Repeat for the next behaviour.

## Bugs

Reproduce the bug with a failing test first, then fix. The test proves the fix and prevents regression. Never fix a bug without one.

## When stuck

| Problem | Do |
|---|---|
| Don't know how to test | Write the wished-for API and the assertion first. |
| Test too complicated | The design is too complicated; simplify the interface. |
| Must mock everything | Code too coupled; inject dependencies. |

## Red flags: stop, delete, restart with TDD

- Code before test, or test added "later"
- Test passed on first run
- Can't explain why the test failed
- "Too simple to test" / "I already tested it manually"
- "Tests after achieve the same thing"
- "Keep it as reference" / "deleting X hours is wasteful"
- "This case is different because..."

| Excuse | Reality |
|---|---|
| "I'll test after" | Tests written after pass immediately and prove nothing. |
| "Need to explore first" | Fine. Throw the exploration away, then TDD. |
| "Existing code has no tests" | You are changing it; add tests for what you touch. |

## Exceptions

Only with the human's explicit permission: throwaway prototypes, generated code, pure configuration files. Ask; do not decide alone. An implementer subagent that believes an exception applies reports NEEDS_CONTEXT instead.

## Evidence to report

- RED: command, failing output excerpt, why that failure was expected.
- GREEN: command, passing output excerpt, full-suite result.
