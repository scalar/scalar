---
'@scalar/api-client': patch
---

Fix the request runner dropping a manually typed auth token when the document name is not slug-safe (e.g. documents loaded via `sources`). The modal now reads auth secrets under the same document key they are written to.
