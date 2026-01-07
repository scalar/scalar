---
description: Run all quality checks (format, lint, types, tests)
---

Run all quality checks: format, lint, types, tests.

1. `pnpm format:check` → offer `pnpm format` if fails
2. `pnpm lint:check` → offer `pnpm lint:fix` if fails
3. `pnpm types:check` → show errors, offer to fix if fails
4. `pnpm test` → show failures, offer to fix if fails

Summary: ✅ All passed / ❌ List failures and offer fixes
