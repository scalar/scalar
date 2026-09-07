---
'@scalar/json-magic': patch
'@scalar/mock-server': patch
---

Bound guarded remote document loading with a shared 10-second deadline, a 5 MiB decompressed response limit, a 20 MiB aggregate byte limit, and at most 100 remote loads, including transitive references. Cancel outstanding streams and connections when a limit is exceeded. Configure these limits through the Node fetch plugin's `limits` option or the mock server's `remoteFetchLimits` option; use a fresh plugin instance for each bundle. Generic unguarded fetch plugins retain their existing behavior unless limits are explicitly supplied.
