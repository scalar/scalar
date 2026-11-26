// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://example.com/docs/" }

import { getOpenApiDocument } from '@test/helpers'
import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

describe('client.browser', () => {
  it.each([
    ['/api/', 'https://example.com/api/examples/schemas/item.json'],
    ['https://cdn.example.com/api/', 'https://cdn.example.com/api/examples/schemas/item.json'],
  ])('resolves external references using the document base %s', async (baseHref, referenceUrl) => {
    const base = document.createElement('base')
    base.href = baseHref
    document.head.append(base)

    try {
      const store = createWorkspaceStore()
      const schema = { type: 'object', properties: { name: { type: 'string' } } }
      const responses: Record<string, unknown> = {
        'examples/openapi.json': {
          openapi: '3.1.0',
          info: { title: 'Relative API', version: '1.0.0' },
          components: { schemas: { Item: { $ref: 'schemas/item.json' } } },
        },
        [referenceUrl]: schema,
      }
      const fetchDocument = vi.fn<typeof fetch>((input) =>
        Promise.resolve(new Response(JSON.stringify(responses[String(input)]))),
      )

      await store.addDocument({ name: 'relative-doc', url: 'examples/openapi.json', fetch: fetchDocument })

      expect(fetchDocument.mock.calls).toEqual([
        ['examples/openapi.json', { headers: undefined }],
        [referenceUrl, { headers: undefined }],
      ])
      expect(getResolvedRef(getOpenApiDocument(store, 'relative-doc')?.components?.schemas?.Item)).toEqual(schema)
    } finally {
      base.remove()
    }
  })
})
