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
 * The localization instances created in this JavaScript context, held weakly.
 *
 * The API Reference, API Client and blocks are separate bundles that only share this module (and its
 * injection key). Keeping the registry at module scope is what lets one `loadLocale` call warm all of
 * their dictionaries, without the host knowing which packages contribute translations.
 *
 * Packages create their instance once, at module scope, but `createLocalization` is public, and a
 * caller that creates one per server request must not grow this registry with every request. So each
 * instance is keyed by an owner object that lives exactly as long as the instance does, and both
 * collections hold it weakly: the `WeakMap` keeps the loaders only while the owner is alive, even
 * though the loaders themselves reference it, and the `WeakRef`s are how `loadLocale` finds them.
 */
const owners = new Set<WeakRef<object>>()
const registrations = new WeakMap<object, RegisteredLocalization>()

/**
 * Registers a localization instance so {@link loadLocale} and {@link isLocaleLoaded} include it.
 *
 * Called by `createLocalization`. The registration ends by itself once nothing references `owner`.
 *
 * @param owner - An object every function of the instance reaches, so it is collected with the instance.
 */
export const registerLocalization = (owner: object, localization: RegisteredLocalization): void => {
  if (!registrations.has(owner)) {
    owners.add(new WeakRef(owner))
  }
  registrations.set(owner, localization)
}

/** The registered instances that are still alive, forgetting the ones that were collected. */
const getRegisteredLocalizations = (): RegisteredLocalization[] => {
  const alive: RegisteredLocalization[] = []

  for (const reference of owners) {
    const owner = reference.deref()
    const localization = owner && registrations.get(owner)

    if (localization) {
      alive.push(localization)
    } else {
      owners.delete(reference)
    }
  }

  return alive
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
  await Promise.all(getRegisteredLocalizations().map((localization) => localization.load(locale)))
}

/**
 * Whether every registered localization instance can render a locale synchronously.
 *
 * Useful to skip waiting for {@link loadLocale} when nothing needs to load, for example before hydration.
 */
export const isLocaleLoaded = (locale?: Locale): boolean =>
  getRegisteredLocalizations().every((localization) => localization.isLoaded(locale))
