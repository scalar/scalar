---
'@scalar/json-magic': minor
'@scalar/openapi-upgrader': minor
'@scalar/workspace-store': patch
---

Upgrade referenced OpenAPI 2.0 and 3.0 resources before bundling, including bare fragments interpreted in their owning API description's dialect and media types. Preserve authored reference targets when schemas and parameters move, and retain their context through lazy loading, serialization, and export.

Add JSON Magic resource and target lifecycle hooks and the typed `upgradeFragment` API. Headerless external resources are traversed through referenced subtrees, including when reached from OpenAPI 3.1/3.2 descriptions. Exports retain compact `x-scalar-upgrade` bookkeeping only when lazy external references still need the original dialect, relocation mappings, or media types.

Resources already stored in an input bundle's `x-ext` keep their existing layout so saved references remain valid. Legacy keywords in those stored resources, including OpenAPI 2.0 schema `x-nullable` and `type: file`, deliberately remain unconverted; newly loaded legacy resources are upgraded.
