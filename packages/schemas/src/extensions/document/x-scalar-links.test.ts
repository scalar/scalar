import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarLinks } from './x-scalar-links'

describe('XScalarLinks', () => {
  it('supports an array of named links', () => {
    const value = {
      'x-scalar-links': [
        { name: 'Privacy Policy', url: 'https://example.com/privacy' },
        { name: 'Imprint', url: 'https://example.com/imprint' },
      ],
    }

    expect(validate(XScalarLinks, value)).toBe(true)
    expect(coerce(XScalarLinks, value)).toEqual(value)
  })
})
