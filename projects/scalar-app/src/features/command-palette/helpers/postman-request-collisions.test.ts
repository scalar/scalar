import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { buildPostmanRequestTree, pathKey } from '@/v2/features/command-palette/helpers/postman-request-tree'

import { getCollidingPostmanRequestPathKeys } from './postman-request-collisions'

describe('getCollidingPostmanRequestPathKeys', () => {
  const items = [
    {
      name: 'A',
      request: { method: 'GET', url: { raw: 'https://x.test/users/1' } },
    },
    {
      name: 'B',
      request: { method: 'GET', url: { raw: 'https://y.test/users/1' } },
    },
    {
      name: 'C',
      request: { method: 'POST', url: { raw: 'https://x.test/users/1' } },
    },
  ]

  it('returns empty when no duplicates among selection', () => {
    const selected = [pathKey([0]), pathKey([2])]
    expect(getCollidingPostmanRequestPathKeys(items, selected)).toEqual([])
  })

  it('returns every selected key that shares merge key with another', () => {
    const selected = [pathKey([0]), pathKey([1])]
    const keys = getCollidingPostmanRequestPathKeys(items, selected)
    expect(keys).toHaveLength(2)
    expect(keys).toContain(pathKey([0]))
    expect(keys).toContain(pathKey([1]))
  })

  it('does not resolve merge keys when item root is the UI tree instead of raw Postman items', () => {
    const tree = buildPostmanRequestTree(items)
    const selected = [pathKey([0]), pathKey([1])]
    expect(getCollidingPostmanRequestPathKeys(tree, selected)).toEqual([])
  })

  it('detects collisions for requests under nested folders', () => {
    const nested = [
      {
        name: 'F1',
        item: [
          {
            name: 'Dup A',
            request: { method: 'GET', url: { raw: 'https://a.test/same' } },
          },
        ],
      },
      {
        name: 'F2',
        item: [
          {
            name: 'Dup B',
            request: { method: 'GET', url: { raw: 'https://b.test/same' } },
          },
        ],
      },
    ]
    const selected = [pathKey([0, 0]), pathKey([1, 0])]
    const keys = getCollidingPostmanRequestPathKeys(nested, selected)
    expect(keys).toHaveLength(2)
  })

  it('flags selection when merge key exists on base OpenAPI document', () => {
    const base = {
      openapi: '3.1.0',
      info: { title: 'Base', version: '1.0.0' },
      paths: {
        '/users/1': {
          get: { responses: { '200': { description: 'ok' } } },
        },
      },
    } as unknown as OpenApiDocument
    const selected = [pathKey([0])]
    const keys = getCollidingPostmanRequestPathKeys(items, selected, base)
    expect(keys).toContain(pathKey([0]))
  })
})
