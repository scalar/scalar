---
'@scalar/workspace-store': patch
---

Cap concurrent external fetches while bundling a document, so documents that reference many external examples (`externalValue`) or references do not open an unbounded number of connections on load
