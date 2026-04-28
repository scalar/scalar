---
'@scalar/api-reference': patch
---

fix(api-reference): cap recursion depth in Schema component to prevent freezing on circular `$ref` chains

Adds a `MAX_DEPTH = 10` guard to the `Schema` component, mirroring the fix applied to `@scalar/openapi-to-markdown` in #8757. Schemas that recursively reference themselves — directly, or via a polymorphic discriminator that closes on itself — are well-formed OpenAPI but were causing the api-reference renderer to recurse indefinitely, freezing the browser tab. Past the depth limit the component now renders a `[Circular Reference]` placeholder.

The new `depth?: number` prop is threaded through `Schema`, `SchemaObjectProperties`, `SchemaProperty`, and `SchemaComposition`, and increments only at the recursive boundary (`Schema → Schema`).
