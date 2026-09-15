---
'@scalar/api-reference': patch
---

Fix recursive variant selectors for schemas whose `oneOf` or `anyOf` variants inherit their base through `allOf`. Keep inherited fields and independent choices without showing sibling variant fields or overflowing the stack when all schema properties are expanded.
