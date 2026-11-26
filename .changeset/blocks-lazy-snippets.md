---
'@scalar/blocks': minor
---

Load code example generators on demand

The client picker now reads static client metadata, and `CodeExample` loads only the selected client's generator, showing an empty placeholder (no error text) while it loads. Server rendering waits for the generator, so the markup still contains the final snippet. Await the new `preloadClients` export before hydrating to make the first browser render match. If a generator fails to load, the snippet area shows a status line with a Retry button instead of an error message as code. `generateCodeSnippet` now needs the client's generator to be loaded first (with `preloadClients` or the new `useClientPlugin` composable). Callers that generated snippets without a preload can switch to the new `generateCodeSnippetAsync`, which loads the generator and then returns the same snippet.
