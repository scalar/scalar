---
'@scalar/api-client': patch
---

Fix renaming an auto-expanded query parameter row: the committed key is applied to the request and persists in the table without writing partial in-progress edits, and the original key no longer reappears as an empty suggestion
