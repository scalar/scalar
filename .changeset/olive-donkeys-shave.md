---
'@scalar/workspace-store': patch
---

Let callers supply their own Schema Object schema to `generateSchema`

The Schema Object subtree is now built by an exported `generateSchemaObject`, and `generateSchema` accepts a Schema Object through a `schemaObject` option. Passing nothing keeps the previous behavior exactly — the generated OpenAPI types are unchanged.

This gives consumers a way to change how schemas are represented without the workspace store carrying a flag for each variation. One case it enables: every branch of the default Schema Object union keys off `type`, so a schema without one — `{}`, or one carrying only annotations — is not a member of the type even though OpenAPI 3.1 allows it and reads it as "any JSON value". Coercion cannot report that, so it substitutes the internal `__scalar_` marker, and `false` under `additionalProperties`, which inverts "any additional property is allowed" into "none are". A caller that needs those schemas preserved can now supply a Schema Object that represents them.
