import { describe, expect, it } from 'vitest'

import { ExtendedOperationSchema } from './operation-object'

describe('Operation Object', () => {
  describe('x-scalar-stability', () => {
    it('parses deprecated', () => {
      expect(
        ExtendedOperationSchema.parse({
          'x-scalar-stability': 'deprecated',
        }),
      ).toMatchObject({
        'x-scalar-stability': 'deprecated',
      })
    })

    it('parses experimental', () => {
      expect(
        ExtendedOperationSchema.parse({
          'x-scalar-stability': 'experimental',
        }),
      ).toMatchObject({
        'x-scalar-stability': 'experimental',
      })
    })

    it('parses stable', () => {
      expect(
        ExtendedOperationSchema.parse({
          'x-scalar-stability': 'stable',
        }),
      ).toMatchObject({
        'x-scalar-stability': 'stable',
      })
    })

    it('parses unknown', () => {
      expect(
        ExtendedOperationSchema.parse({
          'x-scalar-stability': 'unknown',
        }),
      ).toMatchObject({
        'x-scalar-stability': undefined,
      })
    })
  })
})
