---
'@scalar/openapi-upgrader': patch
---

Preserve literal data and tag groups when upgrading to OpenAPI 3.2, migrate XML metadata only in schemas, and remove incompatible legacy XML flags. Make 3.2 upgrades leave the input unchanged, match the complete source version, prevent previously inactive parameter settings from changing serialization, and report path-specific errors for detected compatibility issues that require an author's decision.

Tag `kind` values may change: navigation groups are classified from actual operation-tag usage instead of name substrings. Malformed 3.1 versions now report explicit errors, and the 3.2 pipeline clones the input only once.
