import { describe, expect, it } from 'vitest'

import { filter } from './filter'
import { openapi } from './openapi'

describe('filter', () => {
  const spec = {
    openapi: '3.1.0',
    paths: {
      '/test': {
        get: {
          responses: {
            '200': {
              description: 'visible',
            },
          },
        },
      },
      '/hidden': {
        get: {
          'responses': {
            '200': {
              description: 'hidden',
            },
          },
          'x-internal': true,
        },
      },
    },
  }

  it('filters spec', async () => {
    const result = filter(spec, (schema) => !schema['x-internal'])
    expect(result).toEqual({
      specification: {
        openapi: '3.1.0',
        paths: {
          '/test': {
            get: { responses: { '200': { description: 'visible' } } },
          },
          '/hidden': {},
        },
      },
    })
  })

  it('filters spec with queue', async () => {
    const result = await openapi()
      .load(spec)
      .filter((schema) => !schema['x-internal'])
      .toJson()
    expect(JSON.parse(result)).toEqual({
      openapi: '3.1.0',
      paths: {
        '/test': {
          get: { responses: { '200': { description: 'visible' } } },
        },
        '/hidden': {},
      },
    })
  })
})
