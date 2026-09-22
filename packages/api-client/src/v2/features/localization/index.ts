import { createLocalization } from '@scalar/localization'
import type { ApiClientTranslations, ApiReferenceBuiltInLocale } from '@scalar/types/api-reference'

import { ar } from './locales/ar'
import { de } from './locales/de'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { pt } from './locales/pt'
import { ru } from './locales/ru'
import { zhCn } from './locales/zh-cn'
import { en } from './translations'

/** Dot-path keys for API Client UI strings. */
export type ApiClientTranslationKey = {
  [Group in keyof ApiClientTranslations]: `apiClient.${Group}.${keyof ApiClientTranslations[Group] & string}`
}[keyof ApiClientTranslations]

/** API Client localization, also consumable beneath the API Reference provider. */
export const { provideLocalization, useLocalization, resolveLocalization } = createLocalization<
  { apiClient: ApiClientTranslations },
  ApiClientTranslationKey
>({
  localeTranslations: {
    en: { apiClient: en },
    ru: { apiClient: ru },
    es: { apiClient: es },
    fr: { apiClient: fr },
    de: { apiClient: de },
    'zh-CN': { apiClient: zhCn },
    ar: { apiClient: ar },
    pt: { apiClient: pt },
  } satisfies Record<ApiReferenceBuiltInLocale, { apiClient: ApiClientTranslations }>,
  defaultLocale: 'en',
  rtlLocales: new Set(['ar', 'fa', 'he', 'ur']),
  logPrefix: '[@scalar/api-client]',
})
