# Worktree and Finish

## Start: isolated workspace

1. **Detect existing isolation.** Compare `git rev-parse --git-dir` and `git rev-parse --git-common-dir` (resolved to absolute paths). Different, and `git rev-parse --show-superproject-working-tree` prints nothing: you are already in a worktree. Skip to step 4.
2. **Ask consent** unless the human already stated a preference: "Set up an isolated worktree? It protects your current branch." Declined: work in place, on a feature branch if not already on one (never on main/master without consent), and skip to step 4.
3. **Create.** Prefer a native worktree tool if available. Otherwise use git:
   - Directory: the human's declared preference; else existing `.worktrees/`; else existing `worktrees/`; else `.worktrees/`.
   - Project-local dir must be ignored: `git check-ignore -q .worktrees`. If not, add it to `.gitignore` and commit first.
   - `git worktree add .worktrees/<id> -b <id>` and work there. Permission denied: tell the human and work in place.
4. **Setup:** install project dependencies (`npm install`, `cargo build`, `pip install -r requirements.txt`, ...).
5. **Baseline:** run the full test suite. Failing: report the failures and ask whether to proceed. Passing: report path, branch, and test count.

## Finish

In T2 this runs AFTER `openspec archive <id> -y`, so the archive commit lands on the branch.

1. **Verify:** run the full suite on the tree you will integrate. Failing: report and stop.
2. **Detect:** record the worktree path (`git rev-parse --show-toplevel`) and whether you are in a worktree and on a named branch or detached HEAD.
3. **Base branch:** the branch this forked from. If unsure, ask: "This split from <guess>, correct?"
4. **Present exactly these options** and wait:
   1. Merge back to `<base>` locally
   2. Push and create a pull request
   3. Keep the branch as-is

   Detached HEAD: offer only push-as-new-branch-and-PR, or keep.
5. **Execute:**
   - **Merge:** from the main checkout, `git checkout <base>`, `git pull`, `git merge <branch>`, run tests on the merged result. Failing: stop, leave branch and worktree. Passing: clean up the worktree, then `git branch -d <branch>`.
   - **PR:** `git push -u origin <branch>`, create the PR with the forge CLI following repo conventions, report the URL. Keep the worktree for review feedback.
   - **Keep:** report branch name and worktree path.
6. **Discard** only if the human explicitly asks. List branch, commits, and worktree path, and require them to type `discard`. Then clean up and `git branch -D <branch>`.

## Cleanup (merge or confirmed discard only)

Run from the main checkout. Remove only worktrees under `.worktrees/` or `worktrees/`: `git worktree remove <path>` then `git worktree prune`. Others belong to the host; leave them. If removal is refused for uncommitted files, never `--force`: show `git -C <path> status --porcelain` and ask whether to commit, move, or delete them.

## Red flags

- Assuming you are not in a worktree without checking
- Creating a worktree directory that is not gitignored
- Skipping the baseline or the pre-merge test run
- Merging or discarding without the human choosing
- Force-push or `--force` removal without explicit request
