---
'@scalar/json-schema-validator': patch
'@scalar/mock-server': patch
---

Validate decimal `multipleOf` constraints with exact decimal arithmetic, accepting values such as `19.99` and `1000000.19` for `multipleOf: 0.01` while rejecting nonmultiples without a floating-point tolerance.
