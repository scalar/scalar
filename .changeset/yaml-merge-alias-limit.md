---
'@scalar/helpers': minor
'@scalar/json-magic': patch
'@scalar/openapi-parser': patch
'@scalar/oas-utils': patch
'@scalar/api-reference': patch
---

fix: parse YAML documents that merge shared anchors into many operations

Since yaml 2.9.1, merge keys (`<<: *anchor`) count toward the alias limit, so large API Gateway exports failed with "Excessive alias count indicates a resource exhaustion attack". The limit is now 100,000 and shared through `YAML_MAX_ALIAS_COUNT` from `@scalar/helpers`.
