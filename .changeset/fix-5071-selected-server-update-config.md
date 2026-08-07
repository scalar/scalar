---
'@scalar/api-reference': patch
---

Keep the selected server when the configuration is updated. Pushing a config update to a mounted reference (for example a refreshed auth token via `updateConfiguration`) rebases the document in the store, which previously reset the server selector back to the first server. The user's selected server is now preserved across configuration updates.
