---
'@scalar/workspace-store': patch
---

Preserve boolean schema semantics during client and server ingestion by normalizing true and false schemas to equivalent object schemas before coercion. Keep boolean examples, annotations, and additionalProperties values unchanged.

Server ingestion now clones the complete upgraded document, including bundled `x-ext` data, before normalization so caller-owned schemas and referenced targets remain unchanged. This deliberately increases peak memory by the cloned document graph and inherits the recursive clone helper's depth limit; very large bundles or deeply nested input may require more memory or encounter a stack overflow.
