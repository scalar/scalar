---
'@scalar/api-client': patch
---

Clicking an OAuth2 scope checkbox no longer toggles the scope twice. The click no longer bubbles to the surrounding row, which had its own toggle handler.
