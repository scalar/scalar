---
description: Create a comprehensive pull request
---

Create a pull request with full context about changes made.

Steps:
1. Run git status to check current state
2. Run git log and git diff to understand all changes since branch divergence from main
3. Analyze changed files and identify:
   - Which packages are affected
   - Type of changes (feat, fix, refactor, docs, etc.)
   - Any breaking changes
   - New dependencies added

4. Generate a comprehensive PR description with:
   - **Summary**: Brief overview of what was changed and why
   - **Changes**: Bulleted list of specific changes by package
   - **Packages Affected**: List of @scalar/* packages modified
   - **Breaking Changes**: Any breaking changes (if applicable)
   - **Testing**: How the changes were tested
   - **Screenshots**: Mention if UI changes need screenshots

5. Create the PR using `gh pr create` with the formatted description

6. Return the PR URL to the user

Example PR description format:
```markdown
## Summary
Brief description of what this PR accomplishes

## Changes
- **@scalar/api-client**: Added new authentication method
- **@scalar/components**: Updated button component styles
- **@scalar/types**: Added new type definitions

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Breaking Changes
None / List any breaking changes
```
