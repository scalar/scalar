---
'@scalar/api-reference': patch
---

Fix the "OAuth scopes" section rendering for any security scheme with a non-empty scope array, including `http` and `apiKey` schemes. Scopes are only meaningful for `oauth2` and `openIdConnect` schemes, so the section is now skipped when the resolved scheme is of a different type.
