# Goldfish protocol (T3 review loop)

Adapted from the Elephant-Goldfish Model (Apache-2.0). See `ATTRIBUTION.md`.

A goldfish is a fresh-context reviewer: it finds unstated assumptions because it cannot
fill them in. The controller (the Elephant session) dispatches goldfish; it never
reviews in their place.

## Fresh context is mandatory

- Dispatch every goldfish as a new subagent of type `bridge-goldfish`.
- If the host cannot start one, stop the review and tell the human. A review inside the
  Elephant context is not a goldfish review; do not simulate one.

## Dispatch payload

Pass exactly these four items and nothing else:

```text
Role file:    <abs path>/skills/bridge/vendor/egm/roles/<role>.md
Design doc:   docs/designs/<epic>.md
Sources:      <one repo-relative path per line>
Output:       .bridge/epics/<epic>/reviews/round-<r>/<role>.md
```

Never pass conversation history, discussion summaries, the decision log, earlier
rounds' reports, or your opinion of the doc. Exception: the synthesizer gets this
round's report paths instead of sources.

**Sources** = every file or directory the doc links or cites that resolves inside the
repo and exists. Drop `#fragments`. Files the doc proposes to create are not sources.
For URLs or paths outside the repo, ask the human which to include; save an included
page as a local file and pass that path.

If a goldfish returns its report as text (read-only host), save it verbatim to its
output path.

## Round structure

Round `r` (start at 1):

1. **Comprehension** alone. If it returns `VERDICT: NO_GO`, end the round: resolve its
   findings (see `elephant.md` section 5) and start the next round. Other reviewers
   cannot judge a doc a fresh reader cannot follow.
2. **Critics in parallel**: the selected critic roles below, dispatched in one batch.
3. **Implementation readiness** last, alone, against the doc as it stands.
4. **Synthesizer**: payload is the role file, the doc path, the paths of this round's
   reports, and output `.bridge/epics/<epic>/reviews/round-<r>/synthesis.md`. It merges
   reports into one findings table with ids and an overall verdict.

Do not edit the doc mid-round.

## Role selection

| Doc profile | Roles |
|---|---|
| Minimum (every T3) | `comprehension`, `design_critic`, `implementation_readiness` |
| Large, multi-component, or cross-system | add `structural`, `zoom_out` |
| Heavy current-state claims about existing code | add `codebase_details` |

Fix the role set in round 1 unless the human adds one. Upstream `style` and
`inventive_catalyst` are optional and not vendored here.

## Model guidance

- `comprehension`, `structural`, `synthesizer` (and `style` if added): mid model; pass
  the `sonnet` model override at dispatch.
- `design_critic`, `implementation_readiness`, `zoom_out`, `codebase_details`: strong
  model; use the agent default (no override).

## Failed reviewers

A goldfish that times out, errors, or returns no report did not review. Retry once. If
it fails again, record it as `not run`. Never count it as a reviewer with zero findings.
A round with any `not run` reviewer is NO_GO.

## Findings and severity

Each finding has an id `<role>-r<r>-<n>`, severity, scope, and rationale.

- **Blocker**: the doc cannot proceed; wrong, missing, or unfollowable.
- **Major**: a real gap that will cause rework or risk if left.
- **Nit**: polish. Never blocks.

## Termination rules

Track across rounds in the decision log:

- **Settled**: a finding the Elephant rejected with evidence, declined, or the human
  accepted as residual risk. If a later round raises the same issue at the same scope,
  do not re-open it.
- **Fixed is not settled**: if a later round raises an issue that a fix was meant to
  address, at the same scope, the fix failed or was undone. Re-open it.
- **Clean round**: no unsettled Blocker or Major, and no `not run` reviewer. Decide this
  from the round's reports, before applying that round's fixes.
- **GO**: the latest round is clean, every goldfish returned `VERDICT: GO`, and the
  synthesis verdict is GO.
- **Cap**: 3 rounds. Fresh reviewers sample differently, so zero findings is rare; do
  not chase Nits.
- **Churn**: a new finding sits where a fix was applied, and reverting that fix would
  resolve it. Stop and ask the human.

On cap or churn, list open findings by severity and ask the human one question: accept
the residual risk and proceed, run more rounds, or return the design to brainstorming.
On GO, proceed to the human approval gate in `elephant.md`.
