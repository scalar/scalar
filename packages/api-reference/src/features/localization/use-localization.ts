import { isObject } from '@scalar/helpers/object/is-object'
import { mergeObjects } from '@scalar/helpers/object/merge-objects'
import type {
  ApiReferenceLocale,
  ApiReferenceLocalization,
  ApiReferenceTextDirection,
  ApiReferenceTranslationKey,
  ApiReferenceTranslations,
} from '@scalar/types/api-reference'
import {
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  computed,
  effectScope,
  inject,
  provide,
  toValue,
} from 'vue'

import { DEFAULT_LOCALE, RTL_LOCALES, localeTranslations } from './translations'

type LocalizationContext = {
  locale: ComputedRef<ApiReferenceLocale>
  direction: ComputedRef<ApiReferenceTextDirection>
  translations: ComputedRef<ApiReferenceTranslations>
  translate: (key: ApiReferenceTranslationKey, params?: Record<string, number | string>) => string
}

type ResolvedLocalization = {
  locale: ApiReferenceLocale
  direction: ApiReferenceTextDirection
  translations: ApiReferenceTranslations
}

const LOCALIZATION_SYMBOL: InjectionKey<LocalizationContext> = Symbol('LOCALIZATION')

const resolveBuiltInLocale = (locale?: ApiReferenceLocale): keyof typeof localeTranslations => {
  if (!locale) {
    return DEFAULT_LOCALE
  }

  if (locale in localeTranslations) {
    return locale as keyof typeof localeTranslations
  }

  const normalized = locale.replace('_', '-').toLowerCase()

  if (normalized.startsWith('zh')) {
    return 'zh-CN'
  }

  const language = normalized.split('-')[0]
  const match = Object.keys(localeTranslations).find((key) => key.toLowerCase() === language)

  return (match as keyof typeof localeTranslations | undefined) ?? DEFAULT_LOCALE
}

const resolveDirection = (localization?: ApiReferenceLocalization): ApiReferenceTextDirection => {
  if (localization?.direction && localization.direction !== 'auto') {
    return localization.direction
  }

  const locale = localization?.locale ?? DEFAULT_LOCALE
  const language = locale.replace('_', '-').split('-')[0]?.toLowerCase()

  return language && RTL_LOCALES.has(language) ? 'rtl' : 'ltr'
}

export const resolveLocalization = (localization?: ApiReferenceLocalization): ResolvedLocalization => {
  const locale = localization?.locale ?? DEFAULT_LOCALE
  const builtInLocale = resolveBuiltInLocale(locale)
  const translations = mergeObjects(
    mergeObjects(localeTranslations.en, localeTranslations[builtInLocale]),
    localization?.translations,
  )

  return {
    locale,
    direction: resolveDirection(localization),
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

const createLocalizationContext = (
  localization: MaybeRefOrGetter<ApiReferenceLocalization | undefined>,
): LocalizationContext => {
  const resolved = computed(() => resolveLocalization(toValue(localization)))

  return {
    locale: computed(() => resolved.value.locale),
    direction: computed(() => resolved.value.direction),
    translations: computed(() => resolved.value.translations),
    translate: (key, params) => translateApiReference(resolved.value.translations, key, params),
  }
}

export const provideLocalization = (localization: MaybeRefOrGetter<ApiReferenceLocalization | undefined>) => {
  const context = createLocalizationContext(localization)

  provide(LOCALIZATION_SYMBOL, context)

  return context
}

/**
 * The context handed to callers that sit outside a `provideLocalization` boundary (unit tests, stories, embedded
 * blocks). It carries no state of its own, because `toValue(undefined)` always resolves to the default locale, so a
 * single instance is safe to share between unrelated component trees.
 */
let fallbackContext: LocalizationContext | undefined

/**
 * Builds the shared fallback context on first use.
 *
 * The computeds live in a detached effect scope so that they are not registered with whichever component happened to
 * ask for localization first. Without the detached scope that component's unmount would stop the computeds while other
 * components still hold the same context.
 */
const getFallbackLocalizationContext = (): LocalizationContext =>
  (fallbackContext ??= effectScope(true).run(() => createLocalizationContext(undefined))!)

/**
 * The default is passed as a factory (the third `inject` argument) so that it only runs when no provider is found.
 * Passing it as a plain value would build four computeds and resolve the translation table for every caller, even
 * though the provided context is the one that gets used.
 */
export const useLocalization = (): LocalizationContext =>
  inject(LOCALIZATION_SYMBOL, getFallbackLocalizationContext, true)
