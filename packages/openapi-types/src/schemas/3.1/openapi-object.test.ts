import { describe, expect, it } from 'vitest'

import { OpenApiObjectSchema } from './openapi-object'

describe('info-object', () => {
  describe('OpenApiObject', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#server-object-example
    it('parses servers', () => {
      const result = OpenApiObjectSchema.parse({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://development.gigantic-server.com/v1',
            description: 'Development server',
          },
          {
            url: 'https://staging.gigantic-server.com/v1',
            description: 'Staging server',
          },
          {
            url: 'https://api.gigantic-server.com/v1',
            description: 'Production server',
          },
        ],
      })

      expect(result).toEqual({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://development.gigantic-server.com/v1',
            description: 'Development server',
          },
          {
            url: 'https://staging.gigantic-server.com/v1',
            description: 'Staging server',
          },
          {
            url: 'https://api.gigantic-server.com/v1',
            description: 'Production server',
          },
        ],
      })
    })
  })
})
