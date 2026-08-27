import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { mergeObjects } from '@scalar/helpers/object/merge-objects'
import type { PartialDeep } from 'type-fest'
import { type ComputedRef, type InjectionKey, type MaybeRefOrGetter, computed, inject, provide, toValue } from 'vue'

/** A locale identifier, for example `en` or `zh-CN`. */
export type Locale = string

/** Text direction used when rendering localized content. */
export type TextDirection = 'ltr' | 'rtl'

/** Text direction preference. `auto` derives the direction from the locale. */
export type TextDirectionPreference = TextDirection | 'auto'

/** Values interpolated into a translation template through `{name}` placeholders. */
export type TranslateParams = Record<string, number | string>

/** Translates a dot-path key into a localized string. */
export type TranslateFn<Key extends string> = (key: Key, params?: TranslateParams) => string

/** Reactive localization context shared through Vue's provide/inject. */
export type LocalizationContext<Translations, Key extends string> = {
  locale: ComputedRef<Locale>
  direction: ComputedRef<TextDirection>
  translations: ComputedRef<Translations>
  translate: TranslateFn<Key>
}

/** Fully resolved localization state for a single locale. */
export type ResolvedLocalization<Translations> = {
  locale: Locale
  direction: TextDirection
  translations: Translations
}

/** Localization input accepted by a localization instance. */
export type LocalizationInput<Translations> = {
  /** Locale used to select built-in translations. */
  locale?: Locale
  /** Text direction. `auto` derives the direction from the locale. */
  direction?: TextDirectionPreference
  /** Custom translations merged on top of the built-in locale and the default fallback. */
  translations?: PartialDeep<Translations>
}

/** Content and defaults a localization instance is built from. */
export type LocalizationConfig<Translations extends Record<string, unknown>> = {
  /** Built-in translations keyed by locale identifier. Must include {@link LocalizationConfig.defaultLocale}. */
  localeTranslations: Record<string, Translations>
  /** Locale used as the base fallback when a key or locale is missing. */
  defaultLocale: string
  /** Languages (primary subtag, for example `ar`) that render right-to-left. */
  rtlLocales: Set<string>
  /** Prefix used for the missing-translation development warning. */
  logPrefix?: string
}

/**
 * Shared injection key for the localization context.
 *
 * This lives at module scope so that every package consuming `@scalar/localization` injects the
 * exact same symbol a provider used. Instances created through {@link createLocalization} may be
 * typed differently, so the key is intentionally untyped here and narrowed inside each instance.
 * This shared identity is what lets a component provided in one package be consumed from another.
 */
const LOCALIZATION_SYMBOL: InjectionKey<unknown> = Symbol('scalar-localization')

/**
 * Creates a localization instance bound to a specific set of translations.
 *
 * The returned `provideLocalization`/`useLocalization` pair shares a single module-level injection
 * key, so a component provided with one instance can be consumed from another package's instance.
 * This is what lets translations flow across package boundaries.
 *
 * @param config - Built-in translations plus locale/direction defaults.
 */
export const createLocalization = <Translations extends Record<string, unknown>, Key extends string>(
  config: LocalizationConfig<Translations>,
) => {
  const { localeTranslations, defaultLocale, rtlLocales, logPrefix = '[@scalar/localization]' } = config

  const resolveBuiltInLocale = (locale?: Locale): string => {
    if (!locale) {
      return defaultLocale
    }

    if (locale in localeTranslations) {
      return locale
    }

    const normalized = locale.replace('_', '-').toLowerCase()

    if (normalized.startsWith('zh') && 'zh-CN' in localeTranslations) {
      return 'zh-CN'
    }

    const language = normalized.split('-')[0]
    const match = Object.keys(localeTranslations).find((key) => key.toLowerCase() === language)

    return match ?? defaultLocale
  }

  const resolveDirection = (localization?: LocalizationInput<Translations>): TextDirection => {
    if (localization?.direction && localization.direction !== 'auto') {
      return localization.direction
    }

    const locale = localization?.locale ?? defaultLocale
    const language = locale.replace('_', '-').split('-')[0]?.toLowerCase()

    return language && rtlLocales.has(language) ? 'rtl' : 'ltr'
  }

  const resolveLocalization = (localization?: LocalizationInput<Translations>): ResolvedLocalization<Translations> => {
    const locale = localization?.locale ?? defaultLocale
    const builtInLocale = resolveBuiltInLocale(locale)

    // The default locale is the base every other layer merges onto, so a missing key always
    // falls back to it rather than to the raw key.
    const base = localeTranslations[defaultLocale] ?? ({} as Translations)
    const translations = mergeObjects(mergeObjects(base, localeTranslations[builtInLocale]), localization?.translations)

    return {
      locale,
      direction: resolveDirection(localization),
      translations,
    }
  }

  const translate = (translations: Translations, key: Key, params?: TranslateParams): string => {
    const value = getValueAtPath(translations, key.split('.'))

    // Accessed defensively so the engine is safe outside a Vite/Vitest context, where
    // `import.meta.env` is not defined.
    const isDev = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV

    if (typeof value !== 'string' && isDev) {
      console.warn(`${logPrefix} Missing translation for key "${key}". Falling back to the key itself.`)
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

  const createContext = (
    localization: MaybeRefOrGetter<LocalizationInput<Translations> | undefined>,
  ): LocalizationContext<Translations, Key> => {
    const resolved = computed(() => resolveLocalization(toValue(localization)))

    return {
      locale: computed(() => resolved.value.locale),
      direction: computed(() => resolved.value.direction),
      translations: computed(() => resolved.value.translations),
      translate: (key, params) => translate(resolved.value.translations, key, params),
    }
  }

  const provideLocalization = (localization: MaybeRefOrGetter<LocalizationInput<Translations> | undefined>) => {
    const context = createContext(localization)

    provide(LOCALIZATION_SYMBOL, context)

    return context
  }

  // Built once per instance and reused as the no-provider fallback, so `useLocalization` does not
  // construct a fresh context (and its computed chain) on every call.
  const fallbackContext = createContext(undefined)

  const useLocalization = (): LocalizationContext<Translations, Key> =>
    inject(LOCALIZATION_SYMBOL, fallbackContext) as LocalizationContext<Translations, Key>

  return {
    resolveLocalization,
    provideLocalization,
    useLocalization,
  }
}
