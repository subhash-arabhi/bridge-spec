# bridge

One global skill for **Claude Code and Cursor** that applies engineering discipline only when the work needs it:

- **OpenSpec** decides **WHAT**: living requirements in `openspec/specs/`, delta specs per change, archive.
- **Superpowers** methods (vendored, trimmed) decide **HOW**: bounded brainstorming, strict TDD, isolated implementer and reviewer subagents.
- **Elephant-Goldfish** (vendored, trimmed) handles **very large design**: a long-context elephant designs, and fresh-context goldfish review.
- **Tiers** keep small work cheap: T0 trivial · T1 small (TDD-lite) · T2 requirement (full pipeline) · T3 epic (EGM, then N T2 changes). `bridge route` decides from a slot frame.
- **Per-role models** via subagents, applied whatever model the session runs on. Edit them in `config/models.json`.

  | Tier | Claude Code | Cursor `anthropic` | Cursor `openai` |
  |---|---|---|---|
  | Recon, mechanical tasks | haiku | claude-haiku-5-5 | gpt-5.6-luna |
  | Implementing, per-task review | sonnet | claude-sonnet-5-5 | gpt-5.6-terra |
  | Final review, goldfish, escalation | opus | claude-opus-5-5 | gpt-5.6-sol |

  Cursor also has a `mixed` profile, where Claude implements and GPT reviews. Switch with `bridge cursor-profile <anthropic|openai|mixed>`.

## Install / update
```bash
npm i -g --prefix ~/.local @fission-ai/openspec@2.0.0   # version: see upstream.lock.json
node skills/bridge/bin/bridge.mjs install                # links skill + CLI, writes agents, adds rubric to ~/.claude/CLAUDE.md
bridge doctor
```
Then paste the printed rubric into **Cursor → Settings → Rules → User Rules** once, and check the Cursor model IDs in `config/models.json` against Cursor's model picker.

Installed footprint: `~/.claude/skills/bridge` and `~/.cursor/skills/bridge` (symlinks to this repo), `~/.local/bin/bridge`, 6 `bridge-*` agents in `~/.claude/agents` and `~/.cursor/agents`, and one marker block in `~/.claude/CLAUDE.md`. No hooks.

After pulling changes: `bridge install && bridge doctor`.

## Layout
| Path | What |
|---|---|
| `skills/bridge/SKILL.md` | Entry point: route, then load one tier file |
| `skills/bridge/reference/` | Tier procedures, artifact map (path contract), model policy, recovery |
| `skills/bridge/vendor/{superpowers,egm}/` | Trimmed upstream methods + LICENSE/ATTRIBUTION |
| `skills/bridge/bin/bridge.mjs` | Zero-dependency CLI: route, state, brief, review-pkg, guard, tasks, upstream-check, build, install, doctor |
| `agents/templates/` | Subagent definitions; `{{model:role}}` filled from `config/models.json` |
| `skills/bridge-sync/` | Monthly upstream sync procedure (used by the cloud routine) |
| `upstream.lock.json` | Pinned upstream versions and shas, plus the vendored source file list |
| `tests/run.mjs` | `node --test tests/run.mjs`: route table, parsers, agent rendering, full OpenSpec lifecycle fixture |

## Monthly sync
A scheduled cloud routine runs `bridge-sync`. `bridge upstream-check` compares the lock with GitHub and exits cheaply when nothing moved. Otherwise the routine rewrites the affected parts on a `bridge-sync/YYYY-MM` branch, runs the tests and opens a PR. It never merges.

## Credits
- Superpowers by Jesse Vincent (MIT)
- Elephant-Goldfish Model by Google (Apache-2.0)
- OpenSpec by Fission AI. The bridge uses its CLI.

Design ideas (not code) are from rpamis/comet `comet-classic`: script-decided routing, scripted phase guards, per-change state, path-only subagent handoffs.
