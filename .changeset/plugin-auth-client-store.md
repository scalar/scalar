---
'@scalar/api-reference': patch
---

Fix the plugin `auth` accessor reading from the wrong store. It now reads from the client store — the same store the reference-side Authentication panel writes credentials into — so plugins see the secrets and selected security schemes the user actually entered instead of an empty state.
