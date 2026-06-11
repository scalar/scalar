---
'@scalar/workspace-store': patch
---

Preserve document-level UI settings (watch mode, selected server, environments, sidebar order) and user-configured servers across `rebaseDocument` — previously every rebase (e.g. a watch mode pull) silently wiped them
