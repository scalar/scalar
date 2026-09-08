---
'@scalar/api-reference': minor
'@scalar/types': minor
'@scalar/schemas': patch
---

refactor(api-reference): remove the legacy schema layout and the `schemaLayout` option

The legacy schema layout — a bordered card per nesting level behind a "Show Child Attributes" pill — is deleted, together with the `schemaLayout` configuration option that selected it. The tree layout is the only schema renderer. Nothing shipped with the option, so no configuration changes are needed. The class names the tree already carried (`.schema-card`, `.property`, `.property--level-N` and their family) are unchanged, so `customCss` keeps working.
