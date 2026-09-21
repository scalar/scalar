---
'@scalar/api-reference': patch
'@scalar/api-client': patch
'@scalar/agent-chat': patch
---

Load the API client modal on its first open request instead of downloading it when the API reference or agent chat mounts. Preserve the requested operation, example, and request-body variant while loading.
