# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

- Imperative, present tense, subject under ~72 characters; the body explains why.
- No `Co-Authored-By` or "Generated with" lines. Attribution is disabled in `settings.json`.
- One logical change per commit. Never commit secrets, `.env*` files or build output.

## Pull Request Workflow

When creating PRs:
1. Analyze the full commit history, not just the latest commit.
2. Use `git diff [base-branch]...HEAD` to see all changes.
3. Write a clear summary of what changed and why.
4. Include a test plan with checkboxes.
5. Push with `-u` for a new branch.

## Working Practices

- Plan first for larger tasks (planner agent or plan mode); small fixes need no plan.
- Write or update tests with the change where a test is worthwhile (see testing rule).
- Review larger changes before committing (code-reviewer agent or the `code-review` skill); fix CRITICAL and HIGH findings.
- Never force-push shared branches. Pushes and merges need confirmation.
