import type { LocaleTranslationsSource } from '@scalar/localization'
import type { ApiReferenceBuiltInLocale } from '@scalar/types/api-reference'

import { en } from './locales/en'

/** Shape of the built-in schema dictionary, taken from the English fallback. */
export type SchemaTranslations = typeof en

/**
 * Built-in schema translations, with every locale except English loaded on demand.
 *
 * English stays static because it is the fallback rendered while another locale loads. Each other locale
 * is its own `import()` chunk, so a page only downloads the language it renders. The API Reference
 * composes these into its own dictionary, which is why the map is part of the public API.
 */
export const schemaLocaleTranslations = {
  en,
  ru: () => import('./locales/ru').then(({ ru }) => ru),
  es: () => import('./locales/es').then(({ es }) => es),
  fr: () => import('./locales/fr').then(({ fr }) => fr),
  de: () => import('./locales/de').then(({ de }) => de),
  'zh-CN': () => import('./locales/zh-cn').then(({ zhCn }) => zhCn),
  'zh-TW': () => import('./locales/zh-tw').then(({ zhTw }) => zhTw),
  ar: () => import('./locales/ar').then(({ ar }) => ar),
  pt: () => import('./locales/pt').then(({ pt }) => pt),
} satisfies Record<ApiReferenceBuiltInLocale, LocaleTranslationsSource<SchemaTranslations>>
