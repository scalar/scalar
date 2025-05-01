import { describe, expect, it } from 'vitest'

import { operationSchema } from './operation'

describe('operationSchema', () => {
  describe('x-scalar-stability', () => {
    it('parses deprecated', () => {
      expect(
        operationSchema.parse({
          'x-scalar-stability': 'deprecated',
        }),
      ).toMatchObject({
        'x-scalar-stability': 'deprecated',
      })
    })

    it('parses experimental', () => {
      expect(
        operationSchema.parse({
          'x-scalar-stability': 'experimental',
        }),
      ).toMatchObject({
        'x-scalar-stability': 'experimental',
      })
    })

    it('parses stable', () => {
      expect(
        operationSchema.parse({
          'x-scalar-stability': 'stable',
        }),
      ).toMatchObject({
        'x-scalar-stability': 'stable',
      })
    })

    it('parses unknown', () => {
      expect(
        operationSchema.parse({
          'x-scalar-stability': 'unknown',
        }),
      ).toMatchObject({
        'x-scalar-stability': undefined,
      })
    })
  })
})
