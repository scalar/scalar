---
'@scalar/api-client': patch
---

Fix OAuth2 authorization code auth behavior in v2 by including `client_id` in token exchange for public clients, preventing duplicate scheme entries when selected scopes change, and applying configured default scopes to initial auth selection.
