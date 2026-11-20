import { schemaLocaleTranslations } from '@scalar/blocks/schema'
import type { LocaleTranslationsSource } from '@scalar/localization'
import type { ApiReferenceBuiltInLocale, ApiReferenceTranslations } from '@scalar/types/api-reference'

import { en } from './locales/en'

/**
 * A built-in API Reference dictionary without the schema strings.
 *
 * `@scalar/blocks` owns the schema strings. They are added when a locale is assembled, so each locale
 * module only carries the API Reference copy and never pulls every schema locale in with it.
 */
export type ReferenceTranslations = Omit<ApiReferenceTranslations, 'schema'>

/** Schema strings for one locale, as `@scalar/blocks` provides them. */
type SchemaStrings = { schema: ApiReferenceTranslations['schema'] }

/**
 * Loads a lazy API Reference locale together with the matching schema locale from `@scalar/blocks`.
 *
 * The schema strings must be part of the API Reference dictionary: consumers in other packages inherit
 * the provider's merged translations, so a missing `schema` group here would mask the blocks strings
 * with the English fallback.
 */
const loadWithSchema = async (
  loadReference: () => Promise<ReferenceTranslations>,
  loadSchema: () => Promise<SchemaStrings>,
): Promise<ApiReferenceTranslations> => {
  const [reference, { schema }] = await Promise.all([loadReference(), loadSchema()])

  return { ...reference, schema }
}

/**
 * Built-in API Reference translations. English is static because it is the fallback rendered while any
 * other locale loads; every other locale is loaded on first use as its own `import()` chunk.
 */
export const localeTranslations = {
  en: { ...en, schema: schemaLocaleTranslations.en.schema },
  ru: () => loadWithSchema(() => import('./locales/ru').then(({ ru }) => ru), schemaLocaleTranslations.ru),
  es: () => loadWithSchema(() => import('./locales/es').then(({ es }) => es), schemaLocaleTranslations.es),
  fr: () => loadWithSchema(() => import('./locales/fr').then(({ fr }) => fr), schemaLocaleTranslations.fr),
  de: () => loadWithSchema(() => import('./locales/de').then(({ de }) => de), schemaLocaleTranslations.de),
  'zh-CN': () =>
    loadWithSchema(() => import('./locales/zh-cn').then(({ zhCn }) => zhCn), schemaLocaleTranslations['zh-CN']),
  'zh-TW': () =>
    loadWithSchema(() => import('./locales/zh-tw').then(({ zhTw }) => zhTw), schemaLocaleTranslations['zh-TW']),
  ar: () => loadWithSchema(() => import('./locales/ar').then(({ ar }) => ar), schemaLocaleTranslations.ar),
  pt: () => loadWithSchema(() => import('./locales/pt').then(({ pt }) => pt), schemaLocaleTranslations.pt),
} satisfies Record<ApiReferenceBuiltInLocale, LocaleTranslationsSource<ApiReferenceTranslations>>

export const DEFAULT_LOCALE: ApiReferenceBuiltInLocale = 'en'

export const RTL_LOCALES = new Set(['ar', 'fa', 'he', 'ur'])
