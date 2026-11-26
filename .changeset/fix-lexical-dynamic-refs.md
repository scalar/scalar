---
'@scalar/api-reference': patch
'@scalar/blocks': patch
'@scalar/json-magic': patch
'@scalar/workspace-store': patch
---

Resolve JSON Schema dynamic references using their lexical resource, and use the same dynamic bindings and static targets for schema rendering and JSON and XML examples.

- Bundling loads URI-qualified `$dynamicRef` targets through configured loader plugins, including externally referenced meta-schemas. Relative references under an opaque schema identifier stay unresolved. Full bundles retain `x-ext-urls` entries for loaded targets when no URL map is supplied.
- Media type `schema` and `itemSchema` use the shared schema validator. They preserve chained `$ref-value` links during coercion and retain their existing public TypeScript types.
