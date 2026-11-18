---
'@scalar/workspace-store': patch
---

Bound generated examples for schemas that reference themselves, so a model with several self-referencing properties renders in milliseconds instead of freezing the page. Recursion now stops after one nested level.
