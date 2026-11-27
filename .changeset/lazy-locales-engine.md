---
'@scalar/localization': minor
---

Load built-in locales on demand and add `loadLocale`

`localeTranslations` entries can now be a loader (`() => Promise<Translations>`, usually a dynamic `import()`) instead of the dictionary itself. A lazy locale starts loading the first time a context resolves to it; until then the default locale renders (with custom `translations` applied), and the context updates reactively once the dictionary arrives. Concurrent requests share one loader call, and a failed load logs a warning, keeps the fallback and is retried on the next request.

`loadLocale(locale)` loads a locale for every localization instance at once, so a host can await it before mounting or hydrating. `isLocaleLoaded(locale)` reports whether that is still needed, and each instance also returns its own `loadLocale`. Providers and consumers wait for the active locale during server rendering, so `renderToString` output stays translated without host code. The registry holds each instance weakly, so instances created per request are released with the request.
