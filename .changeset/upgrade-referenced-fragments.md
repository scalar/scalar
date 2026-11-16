---
'@scalar/json-magic': minor
'@scalar/openapi-upgrader': minor
'@scalar/workspace-store': patch
---

Add resource and reference-target lifecycle hooks and a typed fragment upgrader. Upgrade referenced OpenAPI 2.0 and 3.0 resources before bundling, preserving relocated reference targets and source context through lazy loading.

Omit unused upgrade metadata from server payloads and exports, compact retained reference mappings, and preserve server chunk context when reloading exported documents.
