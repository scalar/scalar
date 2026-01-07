---
description: Run tests for a specific package in the monorepo
---

Run tests for a specific package.

1. If no package specified, list packages/ and ask which to test
2. Navigate to packages/{package-name}
3. Run `pnpm test`
4. Report: tests passed/failed, failures details, coverage
5. If failed, offer to investigate/fix

Usage: `/test-package api-client` or `/test-package` (prompts)
