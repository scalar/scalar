import { describe, expect, it } from 'vitest'

import { LicenseObjectSchema } from '../unprocessed/license-object'

describe('license-object', () => {
  describe('LicenseObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#license-object-example
    it('License Object Example', () => {
      const result = LicenseObjectSchema.parse({
        name: 'Apache 2.0',
        identifier: 'Apache-2.0',
      })

      expect(result).toEqual({
        name: 'Apache 2.0',
        identifier: 'Apache-2.0',
      })
    })
  })
})
