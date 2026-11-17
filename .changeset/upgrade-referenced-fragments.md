---
'@scalar/json-magic': minor
'@scalar/openapi-upgrader': minor
'@scalar/workspace-store': patch
---

Add resource and reference-target lifecycle hooks and a typed fragment upgrader. Upgrade referenced OpenAPI 2.0 and 3.0 resources before bundling, preserving relocated reference targets and source context through lazy loading.

Omit unused upgrade metadata from server payloads and exports, compact retained reference mappings, and preserve server chunk context when reloading exported documents.

Preserve unresolved parameter references, local file origins, existing bundled targets, and legacy schema conversions. Keep relocation indexes compact during client loading. Editable exports retain compact `x-scalar-upgrade` bookkeeping when lazy external references still need their original dialect and media types.

Traverse headerless external resources through referenced subtrees, including when reached from OpenAPI 3.1/3.2 descriptions, so unrelated fragments are not interpreted without an owning context.
