import { type LocaleTranslationsSource, createLocalization } from '@scalar/localization'
import type { ApiClientTranslations, ApiReferenceBuiltInLocale } from '@scalar/types/api-reference'

import { en } from './translations'

export { loadLocale } from '@scalar/localization'

/** Dot-path keys for API Client UI strings. */
export type ApiClientTranslationKey = {
  [Group in keyof ApiClientTranslations]: `apiClient.${Group}.${keyof ApiClientTranslations[Group] & string}`
}[keyof ApiClientTranslations]

/** Built-in API Client dictionaries, namespaced the way the shared localization context expects. */
type ApiClientLocaleTranslations = { apiClient: ApiClientTranslations }

/**
 * Built-in API Client translations. English is static because it is the fallback rendered while any
 * other locale loads; every other locale is its own `import()` chunk, loaded on first use.
 */
const localeTranslations = {
  en: { apiClient: en },
  ru: () => import('./locales/ru').then(({ ru }) => ({ apiClient: ru })),
  es: () => import('./locales/es').then(({ es }) => ({ apiClient: es })),
  fr: () => import('./locales/fr').then(({ fr }) => ({ apiClient: fr })),
  de: () => import('./locales/de').then(({ de }) => ({ apiClient: de })),
  'zh-CN': () => import('./locales/zh-cn').then(({ zhCn }) => ({ apiClient: zhCn })),
  'zh-TW': () => import('./locales/zh-tw').then(({ zhTw }) => ({ apiClient: zhTw })),
  ar: () => import('./locales/ar').then(({ ar }) => ({ apiClient: ar })),
  pt: () => import('./locales/pt').then(({ pt }) => ({ apiClient: pt })),
} satisfies Record<ApiReferenceBuiltInLocale, LocaleTranslationsSource<ApiClientLocaleTranslations>>

/** API Client localization, also consumable beneath the API Reference provider. */
export const { provideLocalization, useLocalization, resolveLocalization } = createLocalization<
  ApiClientLocaleTranslations,
  ApiClientTranslationKey
>({
  localeTranslations,
  defaultLocale: 'en',
  rtlLocales: new Set(['ar', 'fa', 'he', 'ur']),
  logPrefix: '[@scalar/api-client]',
})
