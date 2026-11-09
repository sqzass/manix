# Merge nightly → main

Run these from the repo root:

```bash
git checkout main
git pull dev main
git merge --no-ff nightly
git push dev main
```

Notes:

- The remote is named `dev`, not `origin`. If you ever rename it, swap `dev` for `origin` above.
- `--no-ff` keeps a merge commit so the nightly history stays grouped. If you'd rather fast-forward, drop `--no-ff`.
- If `main` has commits `nightly` doesn't (diverged), you may hit merge conflicts — resolve, `git add`, `git commit`, then push.
- If GitHub branch protection on `main` requires a PR, this direct push will be rejected; open a PR through the website instead.
