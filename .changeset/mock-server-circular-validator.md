---
'@scalar/mock-server': patch
---

Fix request validation falling open for recursive schemas. Resolving a schema that references itself leaves a `'[circular]'` marker where the cycle was cut, which Ajv refused to compile, so the mock server logged an error and skipped validating the request body — or every parameter in that location. The recursion point now compiles as an always-valid schema, and a constraint that would flip that into a stricter one (`not`, `if`, `oneOf`, `contains`, and the keywords that only qualify them) is dropped, so the rest of the schema is enforced again without rejecting requests the document allows.
