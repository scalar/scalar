---
"@scalar/openapi-parser": patch
---

Distinguish reference locations from schema name maps and literal data when validating, dereferencing, and collecting external references. Preserve `$ref` properties with object or boolean schemas, leave examples and default/enum/const values unchanged, and retain errors for malformed references.
