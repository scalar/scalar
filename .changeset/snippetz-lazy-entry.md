---
'@scalar/snippetz': minor
---

Add a `@scalar/snippetz/lazy` entry point that loads code generators on demand

Every client is its own dynamic `import()`, so bundlers split the generators into separate chunks. The entry exports `loadPlugin`, `getLoadedPlugin`, `hasPlugin`, `preloadClients`, an async `print`, the static `clientsMetadata` (target and client keys and titles, no generator code) and `AVAILABLE_CLIENTS`. Loads are cached, deduplicated and retried after a failure. The `snippetz()` API, `@scalar/snippetz/clients` and `@scalar/snippetz/plugins/*` are unchanged.
