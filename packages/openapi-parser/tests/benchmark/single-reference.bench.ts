import { bench, describe, expect } from 'vitest'

import { resolveNew } from './utils/resolveNew'
import { resolveOld } from './utils/resolveOld'

describe('single reference', () => {
  const specification = {
    openapi: '3.1.0',
    info: {
      title: 'Hello World',
      version: '2.0.0',
    },
    paths: {
      '/foobar': {
        post: {
          description: 'Example',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Foobar',
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Foobar: {
          type: 'string',
          example: 'Hello World!',
        },
      },
    },
  }

  bench('@apidevtools/swagger-parser', async () => {
    // Action!
    const result = await resolveOld(specification)

    // Check whether the reference was resolved
    expect((result as any).paths['/foobar'].post.requestBody.content['application/json'].schema.example).toBe(
      'Hello World!',
    )
  })

  bench('@scalar/openapi-parser', async () => {
    // Action!
    const { schema } = await resolveNew(specification)

    // Check whether the reference was resolved
    expect((schema as any).paths['/foobar'].post.requestBody.content['application/json'].schema.example).toBe(
      'Hello World!',
    )
  })
})
