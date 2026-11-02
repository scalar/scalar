---
'@scalar/workspace-store': patch
---

Resolve a relative document URL against the page before bundling, so external references in that document are fetched instead of being resolved to a root path that no loader handles.
