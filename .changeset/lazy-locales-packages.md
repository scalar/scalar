---
'@scalar/api-reference': minor
'@scalar/api-client': minor
'@scalar/blocks': minor
'@scalar/nuxt': patch
---

Load non-English UI translations on demand

English stays bundled. Every other built-in locale (`ar`, `de`, `es`, `fr`, `pt`, `ru`, `zh-CN`, `zh-TW`) is now a separate chunk that is only downloaded when a page uses it, instead of all of them shipping with every page. Until it arrives the interface renders in English and then switches by itself.

Await `loadLocale` (exported from `@scalar/api-reference` and `@scalar/api-client/features/localization`) before mounting to render the configured language on the first paint. Server rendering waits for the configured locale on its own, and `createApiReference` and the Nuxt integration wait for it before hydrating server-rendered markup.

`@scalar/blocks/schema` adds `schemaLocaleTranslations`, which keeps English static and loads the other schema locales on demand. `schemaTranslations` still works but is deprecated, because it bundles every locale.
