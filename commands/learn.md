---
description: "Extract a reusable pattern from the current session and, after user confirmation, save it as a skill in ~/.claude/skills/<name>/SKILL.md."
argument-hint: "[optional topic to focus on]"
disable-model-invocation: true
---

# /learn - Extract Reusable Patterns

Analyze the current session and extract patterns worth saving as skills. Optional focus: `$ARGUMENTS`.

## Trigger

Run `/learn` after solving a non-trivial problem.

## What to Extract

1. **Error Resolution Patterns**: what error, root cause, what fixed it, is it reusable
2. **Debugging Techniques**: non-obvious steps, tool combinations, diagnostic patterns
3. **Workarounds**: library quirks (FastAPI, Motor, discord.py, Ktor, vite), API limitations, version-specific fixes
4. **Project-Specific Patterns**: conventions discovered, architecture decisions, integration patterns

## Output Format

A skill is a directory with a `SKILL.md` file: `~/.claude/skills/<pattern-name>/SKILL.md`, where `<pattern-name>` is lowercase-kebab-case (letters, digits, hyphens), matching the `name` field.

```markdown
---
name: pattern-name
description: One or two sentences stating what this solves and when to use it (trigger conditions: symptoms, error messages, libraries). Specific enough that it is only loaded when relevant.
---

# Descriptive Pattern Name

**Extracted:** YYYY-MM-DD

## Problem
[What problem this solves - be specific]

## Solution
[The pattern/technique/workaround]

## Example
[Code example if applicable]

## When to Use
[Trigger conditions]
```

Project-specific patterns belong in `.claude/skills/<name>/SKILL.md` inside that project instead; ask which scope the user wants.

## Process

1. Review the session for extractable patterns
2. Identify the most valuable/reusable insight
3. Check `~/.claude/skills/` for an existing skill on the same topic (update it rather than duplicating)
4. Draft the SKILL.md and show it to the user
5. Ask the user to confirm (and approve name and scope) BEFORE saving
6. Create `~/.claude/skills/<name>/` and write `SKILL.md` only after confirmation
7. Never include secrets, tokens, connection strings or personal data in a skill

## Notes

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Focus on patterns that will save time in future sessions
- Keep skills focused: one pattern per skill
