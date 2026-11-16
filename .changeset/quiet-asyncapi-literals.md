---
'@scalar/workspace-store': patch
'@scalar/json-magic': patch
---

Preserve literal $ref values in AsyncAPI examples, schema values, and extensions during initial loading and lazy resolution without fetching them. Index authored document keys without following virtual proxy links. Keep wrapper resolution independent of key order and ignore reference siblings in AsyncAPI parameter schemas and wrapped OpenAPI 3.0 and draft-04/06 schemas, including identifiers and anchors in those ignored siblings. Traverse only schema and identity keywords supported by the wrapped format so unknown keyword values stay literal, including draft-04 `id` and draft-06/07 `$id` handling.
