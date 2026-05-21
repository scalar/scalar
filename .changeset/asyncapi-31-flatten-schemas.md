---
'@scalar/schemas': patch
---

refactor: flatten AsyncAPI 3.1 schemas and validate resolved references

- Remove per-schema `create*` factories; export flat schemas using `recursiveRef` directly
- Add `asyncApiResolvedReference` for reference-only fields (`operation.channel`, `channel.servers`, `operation.reply`, and similar) so `$ref-value` is always validated
- Export `asyncApiObjectSchema` directly and use it for generated `AsyncApiDocument` types
