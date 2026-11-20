---
"scalar-app": patch
---

Complete desktop login and registration through a state-checked browser redirect with PKCE, avoiding Safari's mixed-content block on the local callback. Requires the companion dashboard and auth-service update.

Allow 15 minutes to finish desktop registration so new users have time to verify their email before returning to the app.
