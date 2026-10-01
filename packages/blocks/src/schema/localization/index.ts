import { createLocalization } from '@scalar/localization'
import type { ApiReferenceTranslationKey } from '@scalar/types/api-reference'

import { schemaTranslations } from './translations'

/** Schema translations inherit the host locale and custom overrides through the shared context. */
export const { useLocalization } = createLocalization<
  typeof schemaTranslations.en,
  Extract<
    ApiReferenceTranslationKey,
    `schema.${string}` | 'common.copyDefault' | 'common.copyExample' | 'actions.copyLinkTo'
  >
>({
  localeTranslations: schemaTranslations,
  defaultLocale: 'en',
  rtlLocales: new Set(['ar', 'fa', 'he', 'ur']),
  logPrefix: '[@scalar/blocks/schema]',
})
