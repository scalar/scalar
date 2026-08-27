import { createLocalization } from '@scalar/localization'
import type { ApiReferenceTranslationKey, ApiReferenceTranslations } from '@scalar/types/api-reference'

import { DEFAULT_LOCALE, RTL_LOCALES, localeTranslations } from './translations'

/**
 * The API Reference localization instance.
 *
 * This binds the shared `@scalar/localization` engine to the API Reference translations. The engine
 * lives in its own package so other packages (for example `@scalar/blocks`) can consume the same
 * provide/inject context and contribute their own translations.
 */
const { resolveLocalization, provideLocalization, useLocalization } = createLocalization<
  ApiReferenceTranslations,
  ApiReferenceTranslationKey
>({
  localeTranslations,
  defaultLocale: DEFAULT_LOCALE,
  rtlLocales: RTL_LOCALES,
  logPrefix: '[@scalar/api-reference]',
})

export { provideLocalization, resolveLocalization, useLocalization }
