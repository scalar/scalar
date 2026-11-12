import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from './client'
import { createServerWorkspaceStore } from './server'

describe('fragment-loading', () => {
  it('upgrades a bare schema reached through a serialized server operation chunk', async () => {
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com/docs',
      documents: [
        {
          name: 'legacy',
          document: {
            openapi: '3.0.3',
            info: { title: 'Legacy API', version: '1' },
            paths: {
              '/items': {
                get: {
                  responses: {
                    '200': {
                      description: 'OK',
                      content: {
                        'application/json': { schema: { $ref: 'https://example.com/item.json' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    })
    const client = createWorkspaceStore()
    await client.addDocument({
      name: 'legacy',
      document: JSON.parse(JSON.stringify(server.getWorkspace().documents.legacy)),
      fetch: (input) => {
        const url = String(input)
        const value =
          url === 'https://example.com/item.json'
            ? { type: 'string', nullable: true }
            : server.get(new URL(url).pathname.slice('/docs'.length))
        return Promise.resolve(new Response(JSON.stringify(value)))
      },
    })
    await client.resolve(['paths', '/items', 'get'])
    expect(
      getValueAtPath(client.workspace.documents.legacy, [
        'paths',
        '/items',
        'get',
        '$ref-value',
        'responses',
        '200',
        'content',
        'application/json',
        'schema',
        '$ref-value',
        'type',
      ]),
    ).toStrictEqual(['string', 'null'])
  })
})
