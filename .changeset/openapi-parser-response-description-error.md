---
'@scalar/openapi-parser': patch
---

Show a clearer error when a response is missing its `description`. Before, the
validator reported the confusing `must have required property '$ref'` (or
`oneOf must match exactly one schema in oneOf`) instead of pointing at the
actual problem.
