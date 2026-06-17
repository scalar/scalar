---
'@scalar/api-reference': patch
---

Fix `oneOf`/`anyOf` being dropped when nested inside an `allOf`. The composition is now preserved so its variants keep rendering alongside the merged base properties, instead of only the first `allOf` member showing up.
