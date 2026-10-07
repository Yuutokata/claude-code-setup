---
description: "Restate requirements, assess risks and produce a step-by-step plan, then wait for explicit user confirmation before touching any code."
argument-hint: "[feature or change to plan]"
---

# Plan Command

Invokes the **planner** agent (`~/.claude/agents/planner.md`) to create an implementation plan for `$ARGUMENTS` before any code is written.

## What This Command Does

1. **Restate Requirements** - Clarify what needs to be built
2. **Identify Risks** - Surface potential issues and blockers
3. **Create Step Plan** - Break down implementation into phases
4. **Wait for Confirmation** - MUST receive user approval before proceeding

## When to Use

Use `/plan` when:
- Starting a new feature
- Making significant architectural changes
- Working on complex refactoring
- Multiple files/components/services will be affected
- Requirements are unclear or ambiguous

## How It Works

The planner agent will:

1. **Analyze the request** (reading the codebase to ground the plan) and restate requirements in clear terms
2. **Break down into phases** with specific, actionable steps
3. **Identify dependencies** between components
4. **Assess risks** and potential blockers
5. **Estimate complexity** (High/Medium/Low)
6. **Present the plan** and WAIT for your explicit confirmation

## Example Usage

```
User: /plan Notify users on Discord when a tracked job finishes

Agent (planner):
# Implementation Plan: Job Completion Notifications

## Requirements Restatement
- When a job reaches "done" or "failed", notify the subscribed Discord user
- Delivery must survive bot restarts and not send duplicates
- Include job name, result and a link to the dashboard

## Implementation Phases

### Phase 1: Data model (MongoDB)
- Add `notifications` collection: user_id, job_id, status, attempts, created_at
- Unique index on (job_id, user_id) for idempotency
- Add subscription preferences to the user document

### Phase 2: Backend (FastAPI + Motor)
- POST/DELETE /subscriptions endpoints with Pydantic models and auth
- Notification service: enqueue on job status change, retry with backoff
- Unit tests for the service, pytest integration test for the endpoints

### Phase 3: Discord bot (discord.py)
- Background task that delivers pending notifications
- Handle DMs closed / rate limits gracefully

### Phase 4: Frontend (React/TypeScript)
- Subscription toggle in the job view, typed API client
- vitest component tests; Playwright flow for subscribe -> notified state

### Phase 5: Deployment
- New env vars in `.env.example`, compose service updates

## Dependencies
- Existing auth middleware, Motor client, bot token configuration

## Risks
- HIGH: Duplicate or lost notifications on bot restart (idempotency + status field)
- MEDIUM: Discord rate limits with many subscribers
- LOW: Index build time on large collections

## Estimated Complexity: MEDIUM

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)
```

## Important Notes

**CRITICAL**: The planner agent will **NOT** write any code until you explicitly confirm the plan with "yes" or "proceed" or similar affirmative response.

If you want changes, respond with:
- "modify: [your changes]"
- "different approach: [alternative]"
- "skip phase 2 and do phase 3 first"

## After Planning

- Implement with the `tdd` skill where tests are worthwhile
- Use `/build-fix` if build errors occur
- Use `/verify` before committing and the `code-review` skill to review the result
