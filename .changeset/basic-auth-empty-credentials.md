---
'@scalar/workspace-store': patch
---

Do not send a Basic `Authorization` header when both the username and password are empty, instead of falling back to a `username:password` placeholder
