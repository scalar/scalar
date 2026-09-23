---
'@scalar/workspace-store': patch
'@scalar/schemas': patch
---

Stop following `$ref-value` chains at the first reference that loops back, so a document whose references point at each other (or at themselves) no longer overflows the stack while it loads.
