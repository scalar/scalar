import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XScalarLinksSchema } from './x-scalar-links'

describe('XScalarLinksSchema', () => {
  it('supports an array of named links', () => {
    const result = Value.Parse(XScalarLinksSchema, {
      'x-scalar-links': [
        { name: 'Privacy Policy', url: 'https://example.com/privacy' },
        { name: 'Imprint', url: 'https://example.com/imprint' },
      ],
    })

    expect(result).toEqual({
      'x-scalar-links': [
        { name: 'Privacy Policy', url: 'https://example.com/privacy' },
        { name: 'Imprint', url: 'https://example.com/imprint' },
      ],
    })
  })

  it('defaults to an empty object when nothing is provided', () => {
    const result = Value.Parse(XScalarLinksSchema, {})

    expect(result).toEqual({})
  })
})
