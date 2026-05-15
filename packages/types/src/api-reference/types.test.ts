import { describe, expect, it } from 'vitest'

import { isConfigurationWithSources } from './types'

describe('types', () => {
  it('narrows configs that declare a sources array', () => {
    expect(isConfigurationWithSources({ sources: [] })).toBe(true)
    expect(isConfigurationWithSources({ layout: 'modern' })).toBe(false)
    expect(isConfigurationWithSources([])).toBe(false)
  })
})
