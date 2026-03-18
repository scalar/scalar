---
'@scalar/api-client': patch
---

fix: prevent stale SSE response bodies on repeated sends by disabling request caching for SSE requests
