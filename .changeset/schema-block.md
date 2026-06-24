---
'@scalar/blocks': minor
'@scalar/components': minor
'@scalar/workspace-store': minor
'@scalar/api-reference': patch
---

Extract the schema rendering into a new `@scalar/blocks/schema` block. The block exposes the `Schema`, `SchemaProperty`, `SchemaHeading` and `SchemaObjectExampleCodeBlock` components plus a standalone `createSchema` mount, mirroring the existing `code-example` block. `@scalar/components` gains `ScalarBadge` and `ScalarScreenReader`, and `@scalar/workspace-store` gains a `getValueByPointer` helper that resolves a JSON pointer while following `$ref`s. The API reference renders schemas through the block; its public API is unchanged.
