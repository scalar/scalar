import type { ApiReferenceBuiltInLocale, ApiReferenceTranslations } from '@scalar/types/api-reference'

import { ar } from './locales/ar'
import { de } from './locales/de'
import { en } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { ru } from './locales/ru'
import { zhCn } from './locales/zh-cn'

export const apiReferenceTranslations = {
  en,
  ru,
  es,
  fr,
  de,
  'zh-CN': zhCn,
  ar,
} satisfies Record<ApiReferenceBuiltInLocale, ApiReferenceTranslations>

export const DEFAULT_API_REFERENCE_LOCALE: ApiReferenceBuiltInLocale = 'en'

export const RTL_LOCALES = new Set(['ar', 'fa', 'he', 'ur'])
