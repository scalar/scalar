---
'@scalar/openapi-upgrader': minor
'@scalar/mock-server': patch
'@scalar/openapi-to-markdown': patch
---

Preserve literal data and tag groups when upgrading to OpenAPI 3.2, migrate XML metadata only in schemas, and remove incompatible legacy XML flags. Make 3.2 upgrades leave the input unchanged, match the complete source version, prevent previously inactive parameter settings from changing serialization, and report path-specific errors for detected compatibility issues that require an author's decision.

Tag `kind` values may change: navigation groups are classified from actual operation-tag usage instead of name substrings. Malformed 3.1 versions now report explicit errors, and successful 3.2 upgrades clone the input only once.

Expose `UpgradeIncompatibilityError` so Markdown generation can retain OpenAPI 3.1 for descriptions requiring author decisions instead of failing or silently changing semantics. Clone safety and malformed-version errors still propagate.

The mock server also retains OpenAPI 3.1 when the strict 3.2 migration reports compatibility diagnostics. Existing inline XML descriptions continue loading without inventing element names.

Read only own data properties during migration so inherited parameter lists, XML metadata, and reference targets cannot modify prototype-owned objects.

Add `upgrade(input, '3.2', { onIncompatible: 'collect' })` to return a complete document and compatibility diagnostics. Compatible descriptions upgrade to 3.2; incompatible descriptions retain 3.1 without partial transformations. Strict mode remains the default, and malformed-version and clone-safety errors still propagate. The Markdown converter and mock server now use the shared collect mode.
