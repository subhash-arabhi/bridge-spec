# Brainstorming (bounded)

Find out what the human wants, and why, before anything is built. The bridge router decides when this runs; once it does, finish it.

Output: the `## Approach` section of proposal.md, or `openspec/changes/<id>/design.md` when the change needs one (`design=auto`: schema or data model, public API, security, concurrency, cross-module flow, or more than 3 slices). The user approves it at the single combined gate.

<HARD-GATE>
No product code, scaffolding, dependency installs, or implementation steps until the human approves the approach (combined gate). Reading and exploring are fine. After approval the next step is writing-plans, nothing else.
</HARD-GATE>

## 1. Look before you ask

Read `openspec/changes/<id>/proposal.md` and its delta specs, plus anything the human pointed at. If understanding the touched code needs more than a few reads, dispatch `bridge-explorer` with a narrow question and work from its map instead of crawling yourself.

Keep going until you can explain how the relevant parts work today and what the change touches. Never ask what the code, specs, or conversation already answer, and never reopen what the human already decided.

## 2. Ask: at most `brainstorm_rounds` batched rounds (default 1; 0 when the request is clear)

Ask only when the answer changes what gets built and nothing on hand answers it. Otherwise state your call and reason as a proposal they can correct.

- Batch related questions into one message per round. Never exceed `brainstorm_rounds`. If nothing would change what gets built, ask nothing and list your assumptions at the gate.
- Prefer multiple choice: name each option concretely, its trade-off, and which you would pick.
- Exception: if you do not yet know *why* they want it, ask that as one open question first, with no options attached. Options steer.
- Build each question on what they said or what you found. Make it specific to their project; never read out a generic checklist.
- Ground to cover (territory, not a script): purpose and success, goals, non-goals, anti-goals (what would make it fail even if it works), current state and prior attempts, constraints, details they care about.
- Process choices (where files go, what to read next) are yours. Do them and say so.
- When they say "just guess" or "you decide," propose something concrete.

When the rounds are used up, stop asking. Record remaining unknowns as your calls in the design, marked as such.

## 3. Lay out approaches

In a message of its own: generate several real alternatives, drop weak ones (including any the existing code rules out or that work against the why), and sketch the remaining 2-3 concretely, grounded in what the project does today, with trade-offs. Recommend one with a reason and ask which they want. If there is genuinely one sensible way, say so and explain why the others do not fit.

If the request is really several independent projects, say so, agree an order, and design one at a time.

## 4. Write the approach

Default: 3–8 lines under `## Approach` in proposal.md (key decisions, rejected alternatives, risks). When design.md is needed, keep it to ~80 lines so a capable builder could plan from it without returning to the human. Sections:

- **Context**: intent, the why, current state, constraints.
- **Goals / Non-goals**: include anti-goals.
- **Decisions**: each decision with the alternatives considered, trade-offs, and which was chosen and why. Mark choices you made (not the human) as your calls.
- **Risks**: what could go wrong, and mitigation.
- **Test strategy**: how the delta-spec scenarios will be proven (unit/integration/e2e, key fixtures, what is not tested and why).

Scale to the work: for a small change, a line or two per section is enough.

Before handing it over, reread it as the builder would: anything they would have to ask? Settle minor points yourself (mark as your call); bring only questions whose answer changes what gets built, in one message, most important first.

## 5. Get approval

At the combined gate, present the why, the scenarios (one line each), the approach or design decisions, and the calls you made, all in one message. Approval of an idea in chat is not approval of a doc you have not written. Only an approved design.md lets the phase advance.

## Red flags

| Thought | Reality |
|---|---|
| "I'll offer a menu of what they might want" | Ask why first; options steer. |
| "I'll fill in sensible defaults" | Fine, but say them out loud. |
| "They said 'sounds good' to the idea" | Approval covers what you showed. Write the doc, get it approved. |
| "One more round of questions" | Respect `brainstorm_rounds`. Decide and record it as your call. |
