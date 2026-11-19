---
'@scalar/types': patch
'@scalar/agent-chat': patch
'@scalar/api-client': patch
'@scalar/api-reference': patch
---

Prevent CSP eval violation reports when loading OAuth authentication and AI Chat by configuring Zod before schemas are constructed.
