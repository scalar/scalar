---
'@scalar/workspace-store': patch
---

Preserve boolean schema semantics during client and server ingestion by normalizing true and false schemas to equivalent object schemas before coercion. Keep boolean examples, annotations, and additionalProperties values unchanged.

Server normalization now copies only changed schema containers and their ancestors, preserving caller-owned values and sharing unchanged bundled data. Iterative normalization supports deep schema graphs without adding a recursive clone at server ingestion. Opaque example/default/enum/const values remain literal, including in external resources named like OpenAPI map fields.

Internal schema markers remain available through backing-data APIs such as `getRaw`, but are omitted from public proxy serialization, rendered schema fields, and saved JSON/YAML API-description exports.

After saving, normalized schema positions export `true` as `{}` and `false` as `{ not: {} }`. Validation semantics are unchanged, but the saved representation can differ from the authored text. Boolean `additionalProperties` stays literal `true` or `false`, including after saving and exporting. Original, unsaved exports retain their authored boolean schemas. JSON and YAML exports share the existing save/edit cleanup boundary for internal markers.
