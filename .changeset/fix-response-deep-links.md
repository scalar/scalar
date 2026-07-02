---
'@scalar/api-reference': patch
---

Fix deep links to response properties. Response property anchors now carry a `responses` marker so the target operation is found and scrolled to on a fresh load, and response properties are linkable even when `expandAllResponses` is off (a deep link expands the collapsed response and scrolls the property into view).
