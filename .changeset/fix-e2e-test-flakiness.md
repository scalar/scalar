---
'@scalar/api-reference': patch
---

Fix intermittently failing E2E tests by replacing external Petstore and Galaxy registry URLs with local fixtures, eliminating network dependency during test runs. Also remove leftover debug code (`console.log` and `page.pause()`) from url.e2e.ts.
