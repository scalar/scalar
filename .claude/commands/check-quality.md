---
description: Run all quality checks (format, lint, types, tests)
---

Run all code quality checks to ensure the codebase is ready for commit.

Steps:
1. Run format check: `pnpm format:check`
   - If it fails, offer to run `pnpm format` to fix

2. Run lint check: `pnpm lint:check`
   - If it fails, offer to run `pnpm lint:fix` to auto-fix

3. Run type check: `pnpm types:check`
   - If it fails, show the type errors and offer to fix them

4. Run tests: `pnpm test`
   - If tests fail, show failures and offer to fix them

5. Provide a summary:
   - ✅ All checks passed - ready to commit
   - ❌ Some checks failed - list which ones and offer fixes

This command is useful before:
- Creating a commit
- Creating a pull request
- Pushing to remote
