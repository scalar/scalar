---
'@scalar/api-reference': patch
---

Keep the introduction selected in the sidebar while the top of the document is in view. The sentinel at the start of the document and every description heading observe their own intersections, and the browser delivers those first records in no fixed order, so a server-rendered page could settle on whichever heading arrived last. The selection is now resolved from the sentinel's position instead of the order the events arrive in.
