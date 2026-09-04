---
'@scalar/workspace-store': patch
---

Escape OpenAPI component keys when writing static workspace chunks so a document with a key like `../../evil` cannot write files outside the assets directory
