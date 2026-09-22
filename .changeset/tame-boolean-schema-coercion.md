---
'@scalar/workspace-store': patch
---

Preserve boolean schema semantics during client and server ingestion by normalizing true and false schemas to equivalent object schemas before coercion. Keep boolean examples, annotations, and additionalProperties values unchanged, including literal `additionalProperties: false` in original and saved JSON/YAML exports. Other boolean schema positions use equivalent object schemas (`true` becomes `{}`, `false` becomes `{ not: {} }`) in the working model and after saving; unsaved exports retain the original document.

Server normalization now copies only changed schema containers and their ancestors, preserving caller-owned values and sharing unchanged bundled data. Iterative normalization supports deep schema graphs without adding a recursive clone at server ingestion. Opaque example/default/enum/const values remain literal, including in external resources named like OpenAPI map fields.

Internal schema markers remain available through backing-data APIs such as `getRaw`, but are omitted from public proxy serialization, rendered schema fields, and saved JSON/YAML API-description exports.
