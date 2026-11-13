---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
'@scalar/agent-chat': patch
'@scalar/mock-server': patch
---

Keep plugin document classification consistent through replacement, hydration, and rebasing. Exclude plugin documents from Ask AI and reject unsupported request, authentication, and mock-server processing even when plugin data contains OpenAPI or AsyncAPI fields.
