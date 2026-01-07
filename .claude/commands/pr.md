---
description: Create a comprehensive pull request
---

Create PR with full context.

1. Run `git status`, `git log`, `git diff` to understand changes
2. Analyze: affected packages, change type, breaking changes, new deps
3. Generate PR description:
   - Summary: what/why
   - Changes: by package
   - Testing: unit/e2e/manual
   - Breaking changes if any
4. Create PR: `gh pr create --title "..." --body "..."`
5. Return PR URL

Format:
```markdown
## Summary
Brief description

## Changes
- **@scalar/package**: What changed

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass

## Breaking Changes
None / List
```
