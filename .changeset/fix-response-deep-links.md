---
'@scalar/api-reference': patch
---

Fix deep links to response properties not scrolling when opened in a new tab. Response property anchors now carry a `responses` marker so the target operation is found and rendered on a fresh load, just like request body links.
