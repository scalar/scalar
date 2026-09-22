---
'@scalar/workspace-store': minor
'@scalar/helpers': patch
'@scalar/blocks': minor
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/mock-server': minor
'@scalar/openapi-to-markdown': minor
---

Mock-server XML response bytes now use the shared schema-aware serializer instead of `json2xml`, including attributes, namespaces, and root naming. Existing XML response snapshots may need updating. Supplied serialized XML remains unchanged.

Generate XML examples from schema metadata, preserving attributes, namespaces, array wrappers, repeated elements, and OpenAPI 3.2 text and CDATA nodes. Use the same XML serialization for request bodies, code snippets, response examples, mock responses, and Markdown documentation. Preserve serialized media examples and escape schema string examples as element text.

Explain XML generation failures in response example panels, including the serialized-example escape hatch for large payloads. Report diagnostics to other consumers through a callback or the developer console, and format element-only descendants within mixed content without changing text values.
