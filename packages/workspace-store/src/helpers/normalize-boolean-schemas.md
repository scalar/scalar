# Boolean schema normalization

The workspace working model represents `true` as an untyped object schema and `false` as its negation. This avoids object coercion changing “accepts nothing” into “accepts anything.” Boolean annotations, examples, defaults, enum members, constants, and boolean `additionalProperties` remain literal data.

Normalization returns a copy only when it changes a schema position. It copies changed containers and their ancestors while preserving shared schema targets and cycles. Unchanged branches, including external bundled documents, remain shared. It never mutates the input; it does not promise a fully detached document. The server therefore does not need an additional full-document clone before this step.

Schema discovery, reference lookup, and copy propagation are iterative. A 20,000-level nested schema regression covers normalization itself. Other ingestion stages, including upgrading and coercion, retain their own depth and resource limits; this is not an unlimited-depth ingestion guarantee.

Ordinary vendor extensions and example/default/enum/const payloads are opaque. The bundler's `x-ext` bucket additionally contains external documents and reference targets. Local schema references supply schema context for those targets. Map context is tracked explicitly, so a resource or user-defined entry named `examples` does not turn literal payload keys into OpenAPI fields.

## Internal markers and exports

`__scalar_` distinguishes untyped schema objects inside the store. `getRaw` deliberately returns this backing representation; it is not a sanitized export API. The public proxy's serialization and schema rendering hide internal marker properties. Use `exportDocument(name, 'json' | 'yaml')` for API-description exports; tests cover exports both before and after saving normalized data. `exportWorkspace` is internal workspace persistence state and has a different purpose.

## Measured server normalization cost

A local Node benchmark compared the prior full clone plus normalization with the iterative copy-on-write implementation on a real bundled Stripe API description. The 3,908,678-byte fixture includes externally bundled data under `x-ext`. Five fresh child processes ran each implementation on unchanged and sparse-boolean variants; normalized JSON output matched.

| Fixture | Full clone + normalization | Copy-on-write normalization | Process peak RSS, before → after |
| --- | --- | --- | --- |
| Unchanged | 42.42 ms | 33.93 ms | 124,912 → 116,064 KiB |
| Sparse boolean schemas | 42.78 ms | 34.04 ms | 125,088 → 116,144 KiB |

These are single-machine medians, approximately 20% lower elapsed time and 7% lower process peak RSS for this fixture. Process RSS includes parsing and runtime overhead; it is not an isolated peak-heap measurement. Post-GC heap deltas were about 7.13 MB before and 7.31–7.32 MB after, so this benchmark does not establish a retained-heap saving. Traversal metadata still costs memory, and results depend on document shape. The change removes the unconditional full-document copy and its recursive clone limit, not all normalization costs.
