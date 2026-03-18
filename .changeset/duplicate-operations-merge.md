---
"@scalar/postman-to-openapi": minor
---

Merge duplicate Postman operations into examples instead of overwriting. When importing Postman collections that have multiple requests to the same endpoint (same path + method), the converter now:

- Preserves the first operation as the primary operation
- Stores duplicate operations as examples using the x-scalar-examples extension
- Merges tags from duplicates so operations can belong to multiple folders
- Preserves parameter values and request body content in each example
- Merges unique response status codes from all duplicates

