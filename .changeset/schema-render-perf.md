---
'@scalar/api-reference': patch
---

perf(api-reference): make the schema renderer cheaper to mount and expand

A profiling pass over the schema renderer, measured against a controlled mount benchmark and a real browser on a large OpenAPI document. Rendered output is unchanged: the previous schema layout is byte-identical across 332 comparisons on 78 real operations, and the tree layout differs only by a scoped-style attribute that no rule selects.

The tree's hover affordances no longer anchor on `:has(:hover)`. Those selectors made every row inserted into an open tree invalidate style across the surrounding subtree, so expanding one schema restyled 9,592 elements. The same states are now written as data attributes from `pointerenter` and `pointerleave`, derived from the same DOM adjacency, which takes that to 142 elements and cuts style recalculation on a pointer sweep across an open tree by roughly 85%.

Rows also do less work: the type signature renders inline instead of through a child component, `SpecificationExtension` and `WithBreadcrumb` are no longer mounted on rows where they render nothing, property names are sorted from a single read per name and memoised per `properties` object, a collapsed row counts its children from the key list, and an open row no longer sorts twice. The localization fallback resolves lazily rather than allocating per component instance.

Two changes affect the public `Schema` and `SchemaProperty` exports:

- Schema subtrees are read through the magic and overrides proxies only, so Vue no longer tracks reads below a `Schema` root. Documents are added and replaced whole, so this is invisible in normal use, but a consumer that mutates a schema object in place will no longer trigger a re-render. Lazy `$ref` bundling through the store's `resolve` API is incompatible for the same reason.
- `sortPropertyNames` returns a frozen, shared array. A consumer that sorted the result in place will now throw instead of silently reordering a list other readers depend on.
