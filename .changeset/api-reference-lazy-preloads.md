---
'@scalar/api-reference': minor
---

Export `preloadGrammars` and `getRenderedLanguages`, and wait for highlighted code before hydrating

Syntax highlighting grammars now load on demand. Hosts that hydrate server-rendered markup themselves can await `preloadGrammars(getRenderedLanguages(root))` and `loadLocale(locale)` from `@scalar/api-reference` before mounting, so the first client render matches the server. `createApiReference` does this on its own for the grammars of the code the server rendered, read from the markup's `language-*` classes.
