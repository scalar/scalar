---
'@scalar/workspace-store': patch
---

Fix OAuth2 scope selection freezing in the API reference auth panel. Selecting or deselecting scopes (including Select All and Deselect All) now updates the counter and checkboxes after the first change instead of getting stuck.
