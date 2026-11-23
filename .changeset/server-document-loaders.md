---
'@scalar/workspace-store': minor
---

Add `documentLoading.loaders` to `createServerWorkspaceStore`. The loader plugins you pass replace the built-in URL and file loaders, so URL and file documents, external references, code sample sources, and AsyncAPI schema resources are all loaded through them and the store performs no fetch or file read of its own. A location no loader accepts fails like an unreachable one. `allowPrivateNetworks` and `basePath` configure only the built-in loaders and cannot be combined with `loaders`.
