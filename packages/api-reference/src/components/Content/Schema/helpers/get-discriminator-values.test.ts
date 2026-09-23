import { describe, expect, it } from 'vitest'

import { getDiscriminatorValues } from './get-discriminator-values'

describe('get-discriminator-values', () => {
  it('matches a local reference', () => {
    expect(getDiscriminatorValues('#/components/schemas/Account', { CN: '#/components/schemas/Account' })).toEqual([
      'CN',
    ])
  })

  it('matches a bare component name', () => {
    expect(getDiscriminatorValues('#/components/schemas/Account', { CN: 'Account' })).toEqual(['CN'])
  })

  it('keeps every value mapped to the same schema in source order', () => {
    expect(
      getDiscriminatorValues('#/components/schemas/Account', { CN: 'Account', HK: 'Account', DK: 'Other' }),
    ).toEqual(['CN', 'HK'])
  })

  it('matches external references without conflating equal component names', () => {
    expect(
      getDiscriminatorValues('./accounts.yaml#/Account', {
        CN: './accounts.yaml#/Account',
        DK: './other.yaml#/Account',
        HK: 'Account',
      }),
    ).toEqual(['CN'])
  })

  it('does not infer values for inline schemas', () => {
    expect(getDiscriminatorValues(undefined, { CN: 'Account' })).toEqual([])
  })

  it('preserves an empty string mapping key', () => {
    expect(getDiscriminatorValues('#/components/schemas/Account', { '': 'Account' })).toEqual([''])
  })

  it('returns no values without a matching mapping', () => {
    expect(getDiscriminatorValues('#/components/schemas/Account', { CN: 'Other' })).toEqual([])
    expect(getDiscriminatorValues('#/components/schemas/Account', undefined)).toEqual([])
  })
})
