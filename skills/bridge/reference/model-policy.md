# Model policy

The session model (whatever the user picked) does routing, brainstorming dialogue, the elephant role and controller work. Delegated work runs on the model set in each agent's frontmatter (generated from `config/models.json` in the bridge repo):

| Agent | Claude Code | Cursor `anthropic` (default) | Cursor `openai` | Used for |
|---|---|---|---|---|
| `bridge-explorer` | haiku | claude-haiku-5-5 | gpt-5.6-luna | Read-only recon; returns a compact file map |
| `bridge-cartographer` | haiku | claude-haiku-5-5 | gpt-5.6-luna | Create/update ARCHITECTURE.md |
| `bridge-mechanic` | haiku | claude-haiku-5-5 | gpt-5.6-luna | Tasks with `Size: mechanical` |
| `bridge-implementer` | sonnet | claude-sonnet-5-5 | gpt-5.6-terra | `standard`/`complex` tasks, fix rounds 1-2 |
| `bridge-reviewer` | sonnet | claude-sonnet-5-5 | gpt-5.6-terra | Per-task spec + quality review (never below mid tier) |
| `bridge-final-reviewer` | opus | claude-opus-5-5[effort=high] | gpt-5.6-sol | Whole-change review before archive |
| `bridge-goldfish` | opus | claude-opus-5-5 | gpt-5.6-sol | Fresh-context design review (T3) |

Cursor profile `mixed`: Claude models implement and GPT models review (reviewer, final reviewer, goldfish). A reviewer from a different model family is less likely to share the implementer's blind spots. Switch with `bridge cursor-profile <anthropic|openai|mixed>`. Claude Code always uses the Claude column, because it cannot run OpenAI models.

These models apply whatever model the main session runs on. In Claude Code, a per-call model override (used for escalation) beats agent frontmatter, which beats `CLAUDE_CODE_SUBAGENT_MODEL`. In Cursor the frontmatter model is used even when the chat is on Auto, unless an admin block, a plan limit, or a legacy plan without Max Mode forces Composer.

Escalation: fix round 3 re-dispatches `bridge-implementer` on the strong model: Claude Code passes model override `opus` to the Agent tool. In Cursor, use the profile's escalation model (anthropic/mixed: claude-opus-5-5, openai: gpt-5.6-sol) if the tool allows a per-call model; otherwise ask the user.

Cost rules:
- Prefer `bridge-mechanic` whenever the task text already contains the exact code and test.
- Use `bridge-explorer` instead of reading many files in the main session; ask it for paths and a ≤300-word map.
- Do not run reviewers on T0/T1 work.
- Reviews are the largest cost in T2. Follow `bridge review-plan` (solo reviews only for complex or high-risk tasks; batches for the rest), use lean packages, and run the final review on the strong model only for large or risky changes. `review_mode=lean` (`bridge state <id> --set review_mode=lean`) also skips per-task review of mechanical low-risk tasks.
- If the session model is already the strong model, still dispatch implementers on their configured models.
