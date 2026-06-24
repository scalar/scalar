import type {
  ApiReferenceI18n,
  ApiReferenceLocale,
  ApiReferenceTextDirection,
  ApiReferenceTranslations,
} from '@scalar/types/api-reference'
import { type ComputedRef, type InjectionKey, type MaybeRefOrGetter, computed, inject, provide, toValue } from 'vue'

import { DEFAULT_API_REFERENCE_LOCALE, RTL_LOCALES, apiReferenceTranslations } from './translations'

type ApiReferenceI18nContext = {
  locale: ComputedRef<ApiReferenceLocale>
  direction: ComputedRef<ApiReferenceTextDirection>
  translations: ComputedRef<ApiReferenceTranslations>
  translate: (key: string, params?: Record<string, number | string>) => string
}

type ResolvedApiReferenceI18n = {
  locale: ApiReferenceLocale
  direction: ApiReferenceTextDirection
  translations: ApiReferenceTranslations
}

const API_REFERENCE_I18N_SYMBOL: InjectionKey<ApiReferenceI18nContext> = Symbol('API_REFERENCE_I18N')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const mergeDeep = <T extends Record<string, unknown>>(base: T, override?: unknown): T => {
  if (!override) {
    return { ...base }
  }

  const result: Record<string, unknown> = { ...base }

  if (!isRecord(override)) {
    return result as T
  }

  Object.entries(override).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }

    const baseValue = result[key]
    if (isRecord(baseValue) && isRecord(value)) {
      result[key] = mergeDeep(baseValue, value)
      return
    }

    result[key] = value
  })

  return result as T
}

const resolveBuiltInLocale = (locale?: ApiReferenceLocale): keyof typeof apiReferenceTranslations => {
  if (!locale) {
    return DEFAULT_API_REFERENCE_LOCALE
  }

  if (locale in apiReferenceTranslations) {
    return locale as keyof typeof apiReferenceTranslations
  }

  const normalized = locale.replace('_', '-').toLowerCase()

  if (normalized.startsWith('zh')) {
    return 'zh-CN'
  }

  const language = normalized.split('-')[0]
  const match = Object.keys(apiReferenceTranslations).find((key) => key.toLowerCase() === language)

  return (match as keyof typeof apiReferenceTranslations | undefined) ?? DEFAULT_API_REFERENCE_LOCALE
}

const resolveApiReferenceDirection = (i18n?: ApiReferenceI18n): ApiReferenceTextDirection => {
  if (i18n?.direction && i18n.direction !== 'auto') {
    return i18n.direction
  }

  const locale = i18n?.locale ?? DEFAULT_API_REFERENCE_LOCALE
  const language = locale.replace('_', '-').split('-')[0]?.toLowerCase()

  return language && RTL_LOCALES.has(language) ? 'rtl' : 'ltr'
}

export const resolveApiReferenceI18n = (i18n?: ApiReferenceI18n): ResolvedApiReferenceI18n => {
  const locale = i18n?.locale ?? DEFAULT_API_REFERENCE_LOCALE
  const builtInLocale = resolveBuiltInLocale(locale)
  const translations = mergeDeep(
    mergeDeep(apiReferenceTranslations.en, apiReferenceTranslations[builtInLocale]),
    i18n?.translations,
  )

  return {
    locale,
    direction: resolveApiReferenceDirection(i18n),
    translations,
  }
}

const getTranslationValue = (translations: ApiReferenceTranslations, key: string) =>
  key.split('.').reduce<unknown>((value, segment) => {
    if (!isRecord(value)) {
      return undefined
    }

    return value[segment]
  }, translations)

const translateApiReference = (
  translations: ApiReferenceTranslations,
  key: string,
  params?: Record<string, number | string>,
): string => {
  const value = getTranslationValue(translations, key)

  if (typeof value !== 'string' && import.meta.env.DEV) {
    console.warn(`[@scalar/api-reference] Missing i18n translation for key "${key}". Falling back to the key itself.`)
  }

  const template = typeof value === 'string' ? value : key

  if (!params) {
    return template
  }

  return Object.entries(params).reduce(
    (result, [param, paramValue]) => result.replaceAll(`{${param}}`, String(paramValue)),
    template,
  )
}

const createApiReferenceI18nContext = (
  i18n: MaybeRefOrGetter<ApiReferenceI18n | undefined>,
): ApiReferenceI18nContext => {
  const resolved = computed(() => resolveApiReferenceI18n(toValue(i18n)))

  return {
    locale: computed(() => resolved.value.locale),
    direction: computed(() => resolved.value.direction),
    translations: computed(() => resolved.value.translations),
    translate: (key, params) => translateApiReference(resolved.value.translations, key, params),
  }
}

export const provideApiReferenceI18n = (i18n: MaybeRefOrGetter<ApiReferenceI18n | undefined>) => {
  const context = createApiReferenceI18nContext(i18n)

  provide(API_REFERENCE_I18N_SYMBOL, context)

  return context
}

export const useApiReferenceI18n = (): ApiReferenceI18nContext =>
  inject(API_REFERENCE_I18N_SYMBOL, createApiReferenceI18nContext(undefined))
