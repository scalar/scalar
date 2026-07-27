---
'@scalar/api-reference': patch
---

fix: keep even heading-to-description spacing on the operation title in narrow layouts

The narrow (single-column) operation layout bumped the operation title's bottom margin to 24px, so the gap between the heading and its description no longer matched the 12px used on wider screens. The override is removed so the title keeps the shared 12px spacing at every width.
