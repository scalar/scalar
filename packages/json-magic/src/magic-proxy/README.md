# Dynamic reference caching

`createMagicProxy` keeps ordinary objects in the existing target-keyed cache. An active dynamic scope uses an interned scope array and a second cache keyed by `(scope, raw target)`. The same path returns the same proxy; different bindings may return different proxies for the same template.

## Scan cost

Reference indexing (`documentReferences`) already walks the document when the root proxy is created. Dynamic scoping adds no second document-wide walk. Instead, when traversal reaches the root or a candidate resource (a schema with `$id`, `$defs`, or `$dynamicAnchor`), the proxy collects that resource's `$dynamicAnchor` declarations. The collection is cached per resource object, so each candidate is scanned at most once.

A root without subschema keywords needs only a single-node check. A document with `$id` or `$defs` but no dynamic anchors pays for one scan per candidate resource and keeps the ordinary cache. The benchmark covers both cases; absence of dynamic references does not mean zero overhead.

The scope starts only when a candidate resource actually contains a dynamic anchor, so anchor-free resources keep their shared proxy identity. After that, resource boundaries remain in the scope even without a matching anchor, so resolution respects bookending. Whether a schema is inside an explicit `$id` resource is decided by where it is written, not by the path that reached it: a schema reached through a `$ref` contributes its own anchors and `$defs` to the scope.

There is deliberately no memoized "does this document use `$dynamicRef`" answer. The store adds content to a live document (lazily loaded chunks, client edits), and a cached negative answer would leave references added later permanently unresolved.

## Cache lifetime and size

The cache is lazy and has no fixed size cap or eviction. Eviction would make the next access create a different proxy for a live `(scope, target)` pair, breaking identity relied on by Vue and cycle detection. Memory scales with the distinct resource scopes and targets actually visited, not with the number of repeated reads. More complex resource paths can create more scopes than the number of endpoints.

Both the scope interning cache and the scoped proxy cache use nested WeakMaps. They are owned by the root proxy's shared context. Treat visited entries as document-lifetime allocations while the document and its resources remain reachable; weak keys allow collection after those roots and proxies are discarded. This is not a process-wide cache or a bounded LRU.

The 64-binding regression visits seven scoped targets per binding: the template, its property map, array schema, dynamic item reference, bound item, its property map, and its scalar property. It observes 64 distinct template proxies and 448 scoped proxies across all ten passes, with the same counts after every pass. These counts exclude ordinary root/binding proxies and cache bookkeeping; they are not heap-byte measurements.

## Performance measurements

The repeatable suite lives in `packages/blocks/src/schema/proxy-performance.bench.ts`. Its synthetic OpenAPI 3.1 document has 2,000 operations, 200 shared schemas, and 20 scalar fields per schema. It measures root proxy creation/reference indexing, cold and warm response-schema reads, complete workspace-store ingestion, and mounting one expanded response schema in Vue/jsdom.

Vue/jsdom measures component mounting only; it does not measure browser layout or paint. Store ingestion includes cloning the input. Fixture construction is outside timed sections. The resource variant adds `$id` and `$defs` but no dynamic references.

Results are local measurements, not CI thresholds or a general claim about all API descriptions.

To rerun the benchmark suite after installing and building the workspace dependencies:

```sh
cd packages/blocks
pnpm vitest bench --run src/schema/proxy-performance.bench.ts
```

Set `SCALAR_BENCHMARK_QUICK=1` to check the benchmark harness with two operations, two schemas, two fields, and minimal sampling. That mode is for validation only; its timings are not representative performance measurements.

Edits through the magic proxy's `set` and `deleteProperty` traps invalidate anchor collections and resolved reference caches. Scoped proxies are rebuilt on their next read after a mutation, so Vue sees new identities for those subtrees. Ordinary target-cached proxies retain their identity. Saved child proxies refresh their inherited scope too, including when the parent gains its first anchor after the child was read. Anchor collections are isolated by document revision, traversal mode, and resource view. Collections track the revisions of documents they read, including proxy children inside plain merged schemas. Editing one document leaves unrelated documents’ cached collections intact. Within the edited document, every value-changing write still refreshes scoped proxies and reference caches: even an ordinary field may be a referenced target or part of a merged anchor schema. Mutations made directly to raw objects bypass the traps and require replacing the edited resource objects before recreating the root proxy.

## Supported references

The proxy resolves fragment-only, relative, and absolute `$dynamicRef` values against the lexical resource URI established by the nearest enclosing `$id` or the document base. This includes resources already registered as part of the bundle. A JSON Pointer can enter a subschema directly, and the subschema keeps its lexical resource.

When the initial URI names a `$dynamicAnchor`, the outermost matching anchor on the active traversal path wins. Without an override, resolution uses the initial target. Ordinary anchors, JSON Pointers, and URIs without fragments resolve directly. A JSON Pointer to a schema that also declares a dynamic anchor still resolves directly to that schema.

The proxy refreshes the lexical index on the next dynamic reference read after an edit. JSON and XML example generation read the same virtual accessor, with an equivalent lexical lookup for detached schemas whose resource is available to the generator.
