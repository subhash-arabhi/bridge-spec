# Writing Plans (slices)

Write `openspec/changes/<id>/tasks.md`. The builder is a capable model: it needs **decisions**, not instructions. Write down what it cannot know: which files, which names and interfaces, which spec values, and which tests prove each slice. DRY. YAGNI. TDD.

Inputs: proposal.md (including the Approach section), the delta specs, and design.md if one exists. The delta specs are the binding authority.

## Scope check
If the change spans several independent subsystems, propose splitting it into separate changes.

## Slice sizing (`task_size=slice`, the default)
- A slice is a **vertical** piece of working behavior: its tests and code across whatever files it needs. It takes about 15–30 minutes of work and ends with green tests and a commit.
- Typical changes have 1–4 slices; more than 6 means the change should be split.
- Fold setup, config and docs into the slice that needs them.
- With `task_size=micro`, use 2–5 minute tasks instead (delegated execution with weaker models).

## Format (contract): at most 6 detail lines per slice

```markdown
## 1. Session expiry
- [ ] 1.1 Reject expired sessions end to end
  - Files: `db/migrations/20261112_expiry.sql`, `src/db/sessions.ts`, `src/api/auth.ts`
  - Spec: Session expiry; Expired session rejected
  - Test: `src/api/auth.test.ts` — "rejects expired session", "refreshes near expiry"
  - Size: standard
  - Risk: high
  - Depends: (omit when none)
```

- Group headings are `## <n>. <name>`; slices are `- [ ] <group>.<n> <title>`.
- **Files:** exact paths. They drive the parallel waves (`bridge waves`), so list every file the slice writes.
- **Spec:** requirement names, or scenario names, exactly as written in the delta specs. `bridge brief` quotes those requirements, so builders and reviewers never read whole spec files.
- **Test:** test file and test names, with the spec's exact values where they matter.
- **Size:** `mechanical` (fully determined; can go to `bridge-mechanic`), `standard`, or `complex`.
- **Risk:** `high` for auth, secrets, payments, schema or migrations, public API contracts, concurrency, or data deletion; otherwise `low`. High-risk and complex slices get their own review; low-risk slices rely on tests and the final review (`review_mode=lean`).
- **Depends:** ids of slices whose output this one needs. Slices without dependencies and with disjoint Files can run in parallel.
- Optional **Design:** heading names in design.md to quote into the brief.
- If a later slice depends on an interface, name it in the producing slice's title or Spec line (for example "exposes `expireSession(id)`").

Forbidden: step-by-step TDD recipes (the builder knows TDD), code bodies, "TBD", "handle edge cases", "write tests for the above".

## Self-review (fix inline)
1. Every `#### Scenario:` appears in some slice's Spec or Test line (`bridge scenarios <id>` flags gaps).
2. Every ADDED or MODIFIED requirement has a slice; every REMOVED one has a slice that removes it and its tests.
3. Names and interfaces are consistent across slices; Depends lines are correct.
4. Run `bridge guard plan <id>` and fix what it reports, including warnings about oversized slices.

## Handoff
In one line: the slice count, how many are high-risk, and the parallel waves. With `gates=combined` the plan needs no separate approval; start building unless the user asked to review it.
