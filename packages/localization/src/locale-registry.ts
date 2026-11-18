/** A locale identifier, for example `en` or `zh-CN`. Mirrors `Locale` in `create-localization`. */
type Locale = string

/** The loading surface every localization instance registers with the shared registry. */
type RegisteredLocalization = {
  /** Loads the instance's built-in dictionary for a locale. Never rejects. */
  load: (locale?: Locale) => Promise<void>
  /** Whether the instance can render a locale synchronously. */
  isLoaded: (locale?: Locale) => boolean
}

/**
 * Every localization instance created in this JavaScript context.
 *
 * The API Reference, API Client and blocks are separate bundles that only share this module (and its
 * injection key). Keeping the registry at module scope is what lets one `loadLocale` call warm all of
 * their dictionaries, without the host knowing which packages contribute translations.
 */
const registeredLocalizations = new Set<RegisteredLocalization>()

/**
 * Registers a localization instance so {@link loadLocale} and {@link isLocaleLoaded} include it.
 *
 * Called by `createLocalization`; instances are module-level singletons, so they are never removed.
 */
export const registerLocalization = (localization: RegisteredLocalization): void => {
  registeredLocalizations.add(localization)
}

/**
 * Loads the built-in translations for a locale in every registered localization instance.
 *
 * Call it once before mounting or hydrating to render a non-default locale on the first paint, for
 * example `await loadLocale(configuration.localization?.locale)`. Concurrent calls share the same
 * in-flight requests. The promise never rejects: when a dictionary fails to load, a warning is logged,
 * that package keeps rendering the default locale, and the next request tries again.
 *
 * Instances register when their module is evaluated, so import the packages you render before awaiting
 * this. Instances that register later still load their dictionary on first use.
 *
 * @param locale - Any locale value the localization configuration accepts, such as `de`, `zh-TW` or `pt_BR`.
 * Passing `undefined` (the default locale) resolves immediately.
 */
export const loadLocale = async (locale?: Locale): Promise<void> => {
  await Promise.all(Array.from(registeredLocalizations, (localization) => localization.load(locale)))
}

/**
 * Whether every registered localization instance can render a locale synchronously.
 *
 * Useful to skip waiting for {@link loadLocale} when nothing needs to load, for example before hydration.
 */
export const isLocaleLoaded = (locale?: Locale): boolean =>
  Array.from(registeredLocalizations).every((localization) => localization.isLoaded(locale))
