---
name: bridge-sync
description: Monthly upstream sync for the bridge skill repo. Checks OpenSpec, Superpowers, Elephant-Goldfish and comet for changes since upstream.lock.json, rewrites the bridge where needed, runs tests and opens a PR. Run only from the scheduled routine or when explicitly asked.
disable-model-invocation: true
---

# bridge-sync

You run inside a checkout of the bridge repo. Goal: keep the bridge correct against upstream at the lowest token cost. **Never merge, never push to the default branch, never touch the user's machine.**

## 1. Cheap check first
```bash
node skills/bridge/bin/bridge.mjs upstream-check > /tmp/upstream.json
```
- `actionable` empty and `ideas` empty → print "bridge-sync: no upstream changes" and stop. No branch, no PR.
- Otherwise continue only for the names listed.

## 2. Branch
`git checkout -b bridge-sync/$(date +%Y-%m)`

## 3. Per actionable upstream (openspec, superpowers, egm)
Fetch only what you need:
```bash
git clone --filter=blob:none https://github.com/<repo> /tmp/up/<name>
git -C /tmp/up/<name> log --oneline <pinned_sha>..<head_sha> | head -50
git -C /tmp/up/<name> diff <pinned_sha> <head_sha> -- <vendored_files_changed...>
```
Read the release notes (`gh release view <tag> -R <repo>`, or the CHANGELOG) between the pinned and latest versions.

Then classify and act:
- **openspec** (CLI dependency): look for changes to CLI commands or flags (`init --tools none`, `new change`, `validate --strict --no-interactive`, `archive -y`), the delta spec format, `tasks.md` checkbox parsing, and the directory layout. Update `skills/bridge/bin/bridge.mjs` guards, `reference/tier-2-requirement.md`, `reference/tier-0-1-light.md`, `reference/artifact-map.md` and the test fixture to match. Install the new CLI version in this environment before testing.
- **superpowers** / **egm** (vendored): re-trim only the changed source files into their vendored counterparts (`upstream.lock.json` → `vendored_from`). Keep the bridge contract in `reference/artifact-map.md` binding: no `docs/superpowers`, `.superpowers/`, or upstream script names. Keep each vendored file within roughly 10% of its current word count. Adopt new rules or protocol steps that improve correctness. Do not adopt session-start hooks or "always run" rules; the router decides activation. Update `ATTRIBUTION.md` (version, sha).
- **major** severity: also re-read `skills/bridge/SKILL.md` and the tier files end to end and rewrite any part that no longer matches upstream behavior. Explain each rewrite in the PR.

## 4. comet (ideas only)
For `ideas`: read the commit log and README or SKILL.md diffs of `assets/skills/comet-classic/` since the pinned sha. Copy no code or text. List up to 5 ideas worth adopting (routing, guards, token economy, recovery), each with a one-line rationale, in the PR body. Bump comet's sha in the lock.

## 5. Lock, test, PR
1. Update `upstream.lock.json`: version, sha and `checked` for each processed upstream.
2. `node --test tests/run.mjs` must pass. If it fails, fix it. If you cannot, open the PR as a draft with the failure output.
3. Commit, push the branch, and run `gh pr create`. Title: `bridge-sync: <names> (<YYYY-MM>)`. Body sections:
   - **Upstream changes**: per upstream, versions and the key changes.
   - **Bridge rewrites**: per file, what changed and why.
   - **Breaking for users?**: yes/no, plus what to run after merging: `git pull && bridge install && bridge doctor`, and an `npm i -g --prefix ~/.local @fission-ai/openspec@<v>` line if the CLI version moved.
   - **comet ideas** (if any).
   - **Test output**: the summary lines.
