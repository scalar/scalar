---
"@scalar/openapi-parser": patch
---

Distinguish reference locations from schema name maps and literal data when validating, dereferencing, and collecting external references. Preserve `$ref` properties with object or boolean schemas, leave examples and default/enum/const values unchanged, and retain errors for malformed references.

Retain reference context across external files and fragments. Resolve custom operations while preserving OAuth scope names, discriminator mappings, Link payloads, and specification extension data.
