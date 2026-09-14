---
'@scalar/workspace-store': patch
---

Preserve boolean schema semantics during client and server ingestion by normalizing true and false schemas to equivalent object schemas before coercion. Keep boolean examples, annotations, and additionalProperties values unchanged.
