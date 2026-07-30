---
'@scalar/workspace-store': patch
---

Add a `typelessSchemas` option to `generateSchema` for representing Schema Objects that carry no `type`

Every branch of the Schema Object union keys off `type`, so a type-less schema — `{}`, or one carrying only annotations — is not a member of the type even though OpenAPI 3.1 allows it and reads it as "any JSON value". Coercion cannot report that, so it substitutes: the internal `__scalar_` marker in most positions, and `false` under `additionalProperties`, whose union lists `boolean` first. That last substitution inverts the meaning, since `{}` permits any additional property while `false` forbids all of them, turning a free-form map into a closed object.

With the option enabled the disambiguation branch accepts a type-less schema instead, so `{}` survives coercion as `{}`. The default is unchanged.

Only enable it when coercing a document whose `$ref-value` mirrors are already materialized, such as a `deepClone` taken through a magic proxy. A type-less branch matches any object, so on a document without those mirrors it outscores the reference branch and coercion erases `$ref` nodes.
