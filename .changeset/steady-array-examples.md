---
'@scalar/workspace-store': patch
---

fix: respect array length bounds when generating schema examples

Preserve cycle detection for selected array branches, pad unrestricted annotated items, and prefer a contains sample when no item constraints are declared.
