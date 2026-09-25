import { apiReferenceConfigurationSchema } from '@scalar/schemas/api-reference'
import { DEFAULT_MODELS_SECTION_LABEL } from '@scalar/types/api-reference'
import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { withLocalizedConfigurationDefaults } from './with-localized-configuration-defaults'

const defaults = coerce(apiReferenceConfigurationSchema, {})

describe('with-localized-configuration-defaults', () => {
  it('uses the translated label when configuration contains the schema default', () => {
    const result = withLocalizedConfigurationDefaults({
      ...defaults,
      modelsSectionLabel: DEFAULT_MODELS_SECTION_LABEL,
      localization: { translations: { models: { label: 'Data types' } } },
    })

    expect(result.modelsSectionLabel).toBe('Data types')
  })

  it('preserves an explicit label when the toolbar changes localization', () => {
    const result = withLocalizedConfigurationDefaults(
      { ...defaults, modelsSectionLabel: 'My models' },
      { localization: { translations: { models: { label: 'Data types' } } } },
    )

    expect(result.modelsSectionLabel).toBe('My models')
  })

  it('uses toolbar translations when no explicit label is configured', () => {
    const result = withLocalizedConfigurationDefaults(
      { ...defaults, modelsSectionLabel: DEFAULT_MODELS_SECTION_LABEL },
      { localization: { translations: { models: { label: 'Data types' } } } },
    )

    expect(result.modelsSectionLabel).toBe('Data types')
  })

  it('lets the toolbar explicitly restore the default label', () => {
    const result = withLocalizedConfigurationDefaults(
      { ...defaults, localization: { translations: { models: { label: 'Data types' } } } },
      { modelsSectionLabel: DEFAULT_MODELS_SECTION_LABEL },
    )

    expect(result.modelsSectionLabel).toBe(DEFAULT_MODELS_SECTION_LABEL)
  })
})
