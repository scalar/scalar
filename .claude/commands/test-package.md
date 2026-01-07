---
description: Run tests for a specific package in the monorepo
---

Run tests for a specific package in the Scalar monorepo.

Steps:
1. If the user did not specify a package name, list available packages in the packages/ directory and ask which one to test
2. Navigate to packages/{package-name} directory
3. Run `pnpm test` to execute the test suite
4. Report the test results clearly:
   - Number of tests passed/failed
   - Any specific test failures with details
   - Test coverage if available
5. If tests failed, offer to:
   - Investigate the failures
   - Fix the failing tests
   - Update tests if code changed

Example usage:
- User: "/test-package api-client"
- User: "/test-package" (will prompt for package name)
