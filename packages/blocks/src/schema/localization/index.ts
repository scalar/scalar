import { createLocalization } from '@scalar/localization'
import type { ApiReferenceTranslationKey } from '@scalar/types/api-reference'

import { type SchemaTranslations, schemaLocaleTranslations } from './locale-translations'

/** Schema translations inherit the host locale and custom overrides through the shared context. */
export const { useLocalization } = createLocalization<
  SchemaTranslations,
  Extract<
    ApiReferenceTranslationKey,
    `schema.${string}` | 'common.copyDefault' | 'common.copyExample' | 'actions.copyLinkTo'
  >
>({
  localeTranslations: schemaLocaleTranslations,
  defaultLocale: 'en',
  rtlLocales: new Set(['ar', 'fa', 'he', 'ur']),
  logPrefix: '[@scalar/blocks/schema]',
})
