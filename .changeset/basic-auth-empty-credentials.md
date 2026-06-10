---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

Do not send a Basic `Authorization` header (or fall back to `username:password` placeholders) when both the username and password are empty
