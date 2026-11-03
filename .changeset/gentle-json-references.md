---
'@scalar/json-magic': minor
---

Add `bundleWithDiagnostics` to report reference failures with authored source locations, retain incomplete output, and defer pruning until resolution succeeds. Add opt-in document-aware traversal for OpenAPI, AsyncAPI, and JSON Schema, including literal data boundaries and applicable reference siblings. Preserve cached sources across diagnostic bundle calls.

Use consistent URI fragment decoding across bundling and the magic proxy, and index newly exposed document fragments without revisiting unrelated subtrees.
