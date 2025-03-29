import { describe, expect, it } from 'vitest'

import { ServerObjectSchema } from '../unprocessed/server-object'

describe('server-object', () => {
  describe('ServerObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#server-object-example
    it('parses a single server', () => {
      const result = ServerObjectSchema.parse({
        url: 'https://development.gigantic-server.com/v1',
        description: 'Development server',
      })

      expect(result).toEqual({
        url: 'https://development.gigantic-server.com/v1',
        description: 'Development server',
      })
    })
  })
})
