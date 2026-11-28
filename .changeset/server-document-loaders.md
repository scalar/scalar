---
'@scalar/workspace-store': minor
---

Add `documentLoading.loaders` to `createServerWorkspaceStore`. The loader plugins you pass replace the built-in URL and file loaders, so URL and file documents, external references, URI security requirements, code sample sources, and AsyncAPI schema resources are all loaded through them and the store performs no fetch or file read of its own. A `validate` that throws counts as that loader not accepting the location, so the next loader is tried. A load fails when no loader accepts the location, or when the accepting loader resolves `{ ok: false }` or an invalid result, throws, or rejects: the document is skipped, the reference stays unresolved, or the schema resources are marked as failed. `allowPrivateNetworks` and `basePath` configure only the built-in loaders and cannot be combined with `loaders`.
