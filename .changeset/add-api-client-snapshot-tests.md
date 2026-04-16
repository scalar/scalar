---
'@scalar/api-client': patch
---

Add snapshot testing infrastructure with Playwright

This adds E2E snapshot tests to catch visual regressions in the API client UI. The tests cover:
- Web layout: address bar and request editor
- Desktop layout: sidebar, workspace, and request/response areas
- Address bar component states
- Response viewer empty state
