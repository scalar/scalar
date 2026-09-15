---
'@scalar/api-reference': minor
'@scalar/types': minor
'@scalar/schemas': patch
---

refactor(api-reference): remove the legacy schema layout and the `schemaLayout` option

The legacy schema layout — a bordered card per nesting level behind a "Show Child Attributes" pill — is deleted, together with the `schemaLayout` configuration option that selected it. The tree layout is the only schema renderer.

The `schemaLayout` option never shipped in a release, so there is no `schemaLayout` value to remove from your configuration. Five translation keys the deleted markup owned are removed from `ApiReferenceTranslations`, and therefore from the `ApiReferenceTranslationKey` union: `schema.childAttributes`, `schema.hideChildAttributes`, `schema.showChildAttributes`, `operation.hideHeaders` and `operation.showHeaders`. They labelled the "Show Child Attributes" pill and the headers disclosure toggle, neither of which renders any more. If you override any of them in `localization.translations`, delete those entries — TypeScript will otherwise report an unknown-property error on the object literal.

The class names the tree already carried (`.schema-card`, `.property`, `.property--level-N` and their family) are unchanged, so `customCss` keeps working.
