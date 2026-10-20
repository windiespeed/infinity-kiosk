# Git cheat sheet: keeping your branch up to date

`main` moves every time a pull request merges, so your branch falls behind. Catch it up
**before you start work** and **before you open a pull request**.

## Catch your branch up with main

```bash
git checkout your-branch      # 1. be on your own branch
git fetch origin              # 2. get the latest from GitHub
git merge origin/main         # 3. bring main's changes into your branch
git push                      # 4. send the updated branch back to GitHub
```

Then run `npm install` if `package.json` changed. New photos come along with the merge,
since media lives in GitHub for now.

## If step 3 says there's a conflict

1. Run `git status`. Files listed under "both modified" have conflicts.
2. Open each one. Find the markers below, keep the right lines (often a mix of both),
   and delete the three marker lines:
   ```
   <<<<<<< HEAD
   your version
   =======
   main's version
   >>>>>>> origin/main
   ```
3. Finish the merge:
   ```bash
   git add .
   git commit -m "Merge main into your-branch"
   git push
   ```

Stuck? `git merge --abort` puts everything back the way it was before step 3.

## After your pull request is merged: start fresh

Pull requests are squash-merged, so your old branch keeps its own copies of the same changes
and will conflict next time. Start a new branch from the latest main instead:

```bash
git checkout main
git pull --prune                 # --prune forgets branches GitHub already deleted
git branch -D your-old-branch    # delete your local copy of the merged branch
git checkout -b your-new-branch
```

To reuse the same name, just use it again in the last line.

**Why not keep pushing the old branch?** GitHub deletes a branch automatically after its pull
request merges. If you push your old local copy, the push works and creates the branch on
GitHub again, but it still carries the commits that were already squash-merged. A new pull
request from it shows those old changes again and often conflicts with main.

**Tip:** in VS Code, open Settings, search for **Git: Prune On Fetch** and turn it on, so
VS Code forgets deleted branches by itself.

## Handy checks

| Command | What it tells you |
|---|---|
| `git status` | Which branch you're on and what's changed |
| `git log --oneline -5` | Your last 5 commits |
| `git log --oneline your-branch..origin/main` | What's on main that your branch doesn't have yet (run `git fetch origin` first) |
