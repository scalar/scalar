---
'@scalar/workspace-store': minor
---

Add a `compact` option to the server workspace store, which shrinks the sparse document the browser downloads before it can render anything: Cloudflare's public API goes from 4,447 KB to 431 KB (346 KB to 63 KB gzipped). The navigation becomes one more lazily resolved chunk, and the per-node chunk references become one `x-scalar-chunk-index` extension the client expands back into the very same references as it ingests the document. Defaults are unchanged, and what the client holds in memory is identical either way.
