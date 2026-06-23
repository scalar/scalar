---
'@scalar/api-client': patch
---

fix: label multiple security requirements as alternatives instead of required

When an operation lists more than one security requirement, those are OR-alternatives — only one needs to be satisfied. The auth dropdown no longer labels them all as "Required authentication"; it presents them as available choices. A single requirement (including a combined AND requirement) stays marked as required.
