---
'@scalar/api-reference': patch
---

Preload the standalone ESM build's JavaScript chunks after startup, including nested lazy modules, without executing unused features. Successfully preloaded features remain available in an open page if a later deployment removes the old chunks. This does not resolve mismatches between an already-cached entry point and a newer release.
