---
'@scalar/api-client': patch
---

Fix the Test Request body showing schema defaults instead of the example on first open. This happened for the first operation when its body used oneOf/anyOf and had a named example.
