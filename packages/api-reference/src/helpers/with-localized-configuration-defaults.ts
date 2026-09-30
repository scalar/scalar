import { type ApiReferenceConfiguration, DEFAULT_MODELS_SECTION_LABEL } from '@scalar/types/api-reference'

import { resolveLocalization } from '@/features/localization'

/** Keep model labels consistent between server rendering and prepared client state. */
export const withLocalizedConfigurationDefaults = (
  config: ApiReferenceConfiguration,
  overrides: Partial<ApiReferenceConfiguration> = {},
): ApiReferenceConfiguration => {
  const merged = { ...config, ...overrides }
  const configuredModelsSectionLabel =
    overrides.modelsSectionLabel ??
    (config.modelsSectionLabel !== DEFAULT_MODELS_SECTION_LABEL ? config.modelsSectionLabel : undefined)

  return {
    ...merged,
    modelsSectionLabel:
      configuredModelsSectionLabel ??
      resolveLocalization(merged.localization).translations.models.label ??
      DEFAULT_MODELS_SECTION_LABEL,
  }
}
