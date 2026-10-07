---
description: "Run a sequential multi-agent workflow (feature, bugfix, refactor, security, custom) with structured handoffs between agents."
argument-hint: "[feature|bugfix|refactor|security|custom] <task description>"
disable-model-invocation: true
---

# Orchestrate Command

Sequential agent workflow for complex tasks. Task and workflow type come from `$ARGUMENTS`.

## Available agents

- `Explore` (built-in, read-only): locate code, trace call paths, find usages
- `planner`: implementation plan; `architect`: design decisions
- `tdd-guide`: test-first implementation
- `code-reviewer`: quality review
- `security-reviewer`: vulnerability review
- `build-error-resolver`: fix build/type failures

## Workflow Types

Steps marked (conditional) run only when their condition holds; skip them otherwise and say so in the report.

### feature
```
planner -> tdd-guide (if there is logic worth testing) -> code-reviewer -> security-reviewer (if auth/input/secrets/infra touched)
```

### bugfix
```
Explore (locate and reproduce) -> tdd-guide (regression test + fix, if a test is worthwhile) -> code-reviewer
```

### refactor
```
architect -> code-reviewer -> tdd-guide (only to add characterization tests where coverage is missing)
```

### security
```
security-reviewer -> code-reviewer -> architect (only if findings need design changes)
```

### custom
`/orchestrate custom "Explore,planner,code-reviewer" "Redesign caching layer"`

Insert `build-error-resolver` after any step that leaves the build or type check failing.

Security is conditional: run `security-reviewer` only when the change touches authentication/authorization, user input parsing, secrets/config, database queries, Docker/compose/CI, or external network access. TDD is conditional: skip it for config, docs, trivial or purely visual changes.

## Execution Pattern

For each agent in the workflow:

1. **Invoke agent** with context from the previous agent
2. **Collect output** as a concise handoff document
3. **Pass to next agent**
4. **Aggregate results** into a final report

## Handoff Document Format

```markdown
## HANDOFF: [previous-agent] -> [next-agent]

### Context
[Summary of what was done]

### Findings
[Key discoveries or decisions]

### Files Modified
[List of files touched]

### Open Questions
[Unresolved items for next agent]

### Recommendations
[Suggested next steps]
```

## Parallel Execution

For independent checks, run agents in parallel (for example `code-reviewer` and `security-reviewer` on the same diff, or several `Explore` searches), then merge into one report.

## Final Report Format

```
ORCHESTRATION REPORT
====================
Workflow: <type>
Task: <description>
Agents run: <chain, with skipped steps noted>

SUMMARY
-------
[One paragraph]

AGENT OUTPUTS
-------------
<agent>: [summary]

FILES CHANGED
-------------
[List]

TEST RESULTS
------------
[Pass/fail summary]

SECURITY STATUS
---------------
[Findings, or "not applicable: <reason>"]

RECOMMENDATION
--------------
[SHIP / NEEDS WORK / BLOCKED]
```

## Tips

1. Start with `planner` for complex features and get the user's confirmation before implementation
2. Include `code-reviewer` before merge
3. Keep handoffs concise: only what the next agent needs
4. Run `/verify` between agents if the state is uncertain
