import { describe, expect, it } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { getDiscriminatorPropertyName } from './schema-discriminator'

describe('schema-discriminator', () => {
  describe('getDiscriminatorPropertyName', () => {
    it('returns property name from discriminator', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        discriminator: {
          propertyName: 'type',
        },
      }
      expect(getDiscriminatorPropertyName(schema)).toBe('type')
    })

    it('returns undefined when no discriminator', () => {
      const schema: OpenAPIV3_1.SchemaObject = {}
      expect(getDiscriminatorPropertyName(schema)).toBeUndefined()
    })
  })
})
