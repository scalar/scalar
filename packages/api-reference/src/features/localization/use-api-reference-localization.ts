import { isObject } from '@scalar/helpers/object/is-object'
import { mergeObjects } from '@scalar/helpers/object/merge-objects'
import type {
  ApiReferenceLocale,
  ApiReferenceLocalization,
  ApiReferenceTextDirection,
  ApiReferenceTranslationKey,
  ApiReferenceTranslations,
} from '@scalar/types/api-reference'
import { type ComputedRef, type InjectionKey, type MaybeRefOrGetter, computed, inject, provide, toValue } from 'vue'

import { DEFAULT_API_REFERENCE_LOCALE, RTL_LOCALES, apiReferenceTranslations } from './translations'

type ApiReferenceLocalizationContext = {
  locale: ComputedRef<ApiReferenceLocale>
  direction: ComputedRef<ApiReferenceTextDirection>
  translations: ComputedRef<ApiReferenceTranslations>
  translate: (key: ApiReferenceTranslationKey, params?: Record<string, number | string>) => string
}

type ResolvedApiReferenceLocalization = {
  locale: ApiReferenceLocale
  direction: ApiReferenceTextDirection
  translations: ApiReferenceTranslations
}

const API_REFERENCE_LOCALIZATION_SYMBOL: InjectionKey<ApiReferenceLocalizationContext> =
  Symbol('API_REFERENCE_LOCALIZATION')

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

const resolveApiReferenceDirection = (localization?: ApiReferenceLocalization): ApiReferenceTextDirection => {
  if (localization?.direction && localization.direction !== 'auto') {
    return localization.direction
  }

  const locale = localization?.locale ?? DEFAULT_API_REFERENCE_LOCALE
  const language = locale.replace('_', '-').split('-')[0]?.toLowerCase()

  return language && RTL_LOCALES.has(language) ? 'rtl' : 'ltr'
}

export const resolveApiReferenceLocalization = (
  localization?: ApiReferenceLocalization,
): ResolvedApiReferenceLocalization => {
  const locale = localization?.locale ?? DEFAULT_API_REFERENCE_LOCALE
  const builtInLocale = resolveBuiltInLocale(locale)
  const translations = mergeObjects(
    mergeObjects(apiReferenceTranslations.en, apiReferenceTranslations[builtInLocale]),
    localization?.translations,
  )

  return {
    locale,
    direction: resolveApiReferenceDirection(localization),
    translations,
  }
}

const getTranslationValue = (translations: ApiReferenceTranslations, key: ApiReferenceTranslationKey) =>
  key.split('.').reduce<unknown>((value, segment) => {
    if (!isObject(value)) {
      return undefined
    }

    return value[segment]
  }, translations)

const translateApiReference = (
  translations: ApiReferenceTranslations,
  key: ApiReferenceTranslationKey,
  params?: Record<string, number | string>,
): string => {
  const value = getTranslationValue(translations, key)

  if (typeof value !== 'string' && import.meta.env.DEV) {
    console.warn(`[@scalar/api-reference] Missing translation for key "${key}". Falling back to the key itself.`)
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

const createApiReferenceLocalizationContext = (
  localization: MaybeRefOrGetter<ApiReferenceLocalization | undefined>,
): ApiReferenceLocalizationContext => {
  const resolved = computed(() => resolveApiReferenceLocalization(toValue(localization)))

  return {
    locale: computed(() => resolved.value.locale),
    direction: computed(() => resolved.value.direction),
    translations: computed(() => resolved.value.translations),
    translate: (key, params) => translateApiReference(resolved.value.translations, key, params),
  }
}

export const provideApiReferenceLocalization = (
  localization: MaybeRefOrGetter<ApiReferenceLocalization | undefined>,
) => {
  const context = createApiReferenceLocalizationContext(localization)

  provide(API_REFERENCE_LOCALIZATION_SYMBOL, context)

  return context
}

export const useApiReferenceLocalization = (): ApiReferenceLocalizationContext =>
  inject(API_REFERENCE_LOCALIZATION_SYMBOL, createApiReferenceLocalizationContext(undefined))
