---
'@scalar/workspace-store': patch
---

Let callers supply their own Schema Object schema to `generateSchema`

The Schema Object subtree is now built by an exported `generateSchemaObject`, and `generateSchema` accepts the result through a `schemaObject` option. Passing nothing keeps the previous behavior exactly — the generated OpenAPI types are unchanged.

`generateSchemaObject` takes a `typelessSchemas` option for representing a Schema Object that carries no `type`. Every branch of the Schema Object union keys off `type`, so a type-less schema — `{}`, or one carrying only annotations — is not a member of the type even though OpenAPI 3.1 allows it and reads it as "any JSON value". Coercion cannot report that, so it substitutes: the internal `__scalar_` marker in most positions, and `false` under `additionalProperties`, whose union lists `boolean` first. That last substitution inverts the meaning, since `{}` permits any additional property while `false` forbids all of them, turning a free-form map into a closed object.

With the option enabled, the disambiguation branch accepts a type-less schema and `additionalProperties` resolves an unmatched value to a schema rather than to `false`, so `{}` survives coercion as `{}`. The branch carries every type's validation keywords, so a type-less schema that declares `properties`, `items`, or `additionalProperties` keeps them, and coercion no longer narrows it by inventing a `type` its author never wrote. References are preserved either way.
