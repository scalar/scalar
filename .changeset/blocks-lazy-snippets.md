---
'@scalar/blocks': minor
---

Load code example generators on demand

The client picker now reads static client metadata, and `CodeExample` loads only the selected client's generator, showing an empty placeholder (no error text) while it loads. Server rendering waits for the generator, so the markup still contains the final snippet. Await the new `preloadClients` export before hydrating to make the first browser render match. `generateCodeSnippet` now needs the client's generator to be loaded first (with `preloadClients` or the new `useClientPlugin` composable).
