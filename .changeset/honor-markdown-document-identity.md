---
"@scalar/openapi-to-markdown": patch
---

Resolve references in Node Markdown exports against the OpenAPI 3.2 document's `$self` URI when present.

For object and inline JSON/YAML input, resolve relative `$self` values against the configured `basePath`, or the current directory when omitted. File access still requires an explicit `basePath`.

Preserve literal `$ref` keys in examples when bundling descriptions, including descriptions without `$self`.
