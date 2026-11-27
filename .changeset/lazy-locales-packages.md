---
'@scalar/api-reference': minor
'@scalar/api-client': minor
'@scalar/blocks': minor
'@scalar/nuxt': patch
---

Load non-English UI translations on demand

English stays bundled. Every other built-in locale (`ar`, `de`, `es`, `fr`, `pt`, `ru`, `zh-CN`, `zh-TW`) is now a separate chunk that is only downloaded when a page uses it, instead of all of them shipping with every page.

`createApiReference`, server rendering and the Nuxt integration wait for the configured locale before they render, so the interface appears in that language from the first paint. Apps that mount the components themselves can await `loadLocale` (exported from `@scalar/api-reference` and `@scalar/api-client/features/localization`) before mounting for the same result. Without the wait, the interface renders in English until the locale arrives and then switches by itself.

`@scalar/blocks/schema` adds `schemaLocaleTranslations`, which keeps English static and loads the other schema locales on demand. `schemaTranslations` still works but is deprecated, because it bundles every locale.
