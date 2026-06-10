---
'@scalar/mock-server': minor
---

Extend request validation to header and cookie parameters. Declared `in: header` and `in: cookie` parameters are now validated against their schema (with string coercion and required enforcement), and contract violations return a `422` with a `header` or `cookie` location. Header names are matched case-insensitively, and the `Accept`, `Content-Type`, and `Authorization` headers are ignored as parameters per the OpenAPI specification.
