---
'@scalar/api-reference': minor
---

feat(api-reference): show an "auth required" / "auth optional" badge next to each operation's path. Requirements are resolved via `operation.security ?? document.security`; hover reveals the scheme names, types, and any required scopes.
