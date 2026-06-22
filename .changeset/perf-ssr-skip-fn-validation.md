---
'@scalar/server-side-rendering': patch
---

Speed up the per-render check that rejects nested functions in the config. The common case (no functions) now skips building path strings for every node, while the precise error message is still produced when a nested function is found.
