# bridge

One global skill for **Claude Code and Cursor** that applies engineering discipline only when the work needs it:

- **OpenSpec** decides **WHAT**: living requirements in `openspec/specs/`, delta specs per change, archive.
- **Superpowers** methods (vendored, trimmed) decide **HOW**: bounded brainstorming, strict TDD, isolated implementer and reviewer subagents.
- **Elephant-Goldfish** (vendored, trimmed) handles **very large design**: a long-context elephant designs, and fresh-context goldfish review.
- **Tiers** keep small work cheap: T0 trivial · T1 small (TDD-lite) · T2 requirement (full pipeline) · T3 epic (EGM, then N T2 changes). `bridge route` decides from a slot frame.
- **Per-role models** via subagents: haiku for recon and mechanical tasks, sonnet for implementing and per-task review, opus for final review and goldfish. Edit them in `config/models.json`.

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
