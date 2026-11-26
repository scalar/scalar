---
'@scalar/api-reference': minor
---

Export `preloadGrammars`, `getRenderedLanguages` and `preloadClients`, and wait for highlighted code before hydrating

Syntax highlighting grammars and code example generators now load on demand. Hosts that hydrate server-rendered markup themselves can await `preloadGrammars(getRenderedLanguages(root))`, `preloadClients(['shell/curl'])` and `loadLocale(locale)` from `@scalar/api-reference` before mounting, so the first client render matches the server. `createApiReference` does this on its own for the grammars of the code the server rendered, read from the markup's `language-*` classes.
