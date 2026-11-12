# Resume an active change

Read only:
1. `.bridge/changes/<id>/state.json` (`bridge state <id>`): tier, base, `phase_passed`, per-task `task.<n>` status/base/round, `ruling.*`.
2. `openspec/changes/<id>/tasks.md` checkboxes (`bridge tasks <id>`).
3. `git log --oneline <base>..HEAD` and `git status`.

Then pick the phase:
- no `phase_passed.open` → T2 Open step.
- open passed, no `phase_passed.plan` → Design or Plan (whichever artifact is missing/thin).
- plan passed, unchecked tasks → Build: continue at the first unchecked task. If its `task.<n>.base` exists and commits exist after it, review those before re-dispatching.
- all tasks checked, no `phase_passed.verify` → Verify.
- verify passed → Archive + finish.

For T3 epics, read `.bridge/epics/<epic>/elephant.md` (decision log + "Status" line) and the latest `reviews/round-<r>/` reports, nothing else.

Tell the user in one line where you are resuming. Do not re-read design.md or specs unless the next step needs them.
