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
  it('restores external refs and their dialect when saving and reloading an API description', async () => {
    const fetcher = (): Promise<Response> =>
      Promise.resolve(new Response(JSON.stringify({ type: 'string', nullable: true })))
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'legacy',
      document: {
        openapi: '3.0.3',
        info: { title: 'Legacy API', version: '1' },
        paths: {},
        components: { schemas: { Item: { $ref: 'https://example.com/item.json' } } },
      },
      fetch: fetcher,
    })
    const saved = await store.getEditableDocument('legacy')
    expect(getValueAtPath(saved, ['components', 'schemas', 'Item', '$ref'])).toBe('https://example.com/item.json')
    expect(getValueAtPath(saved, ['x-ext'])).toBeUndefined()
    const reloaded = createWorkspaceStore()
    await reloaded.addDocument({ name: 'legacy', document: saved ?? {}, fetch: fetcher })
    expect(
      getValueAtPath(reloaded.workspace.documents.legacy, ['components', 'schemas', 'Item', '$ref-value', 'type']),
    ).toStrictEqual(['string', 'null'])
  })
  it.each([
    {
      resource: { swagger: '2.0', definitions: { Item: { type: 'string', 'x-nullable': true } } },
      pointer: '/definitions/Item',
    },
    {
      resource: { openapi: '3.0.3', components: { schemas: { Item: { type: 'string', nullable: true } } } },
      pointer: '/components/schemas/Item',
    },
  ])('restores authored pointers into a complete external resource at $pointer', async ({ resource, pointer }) => {
    const ref = `https://example.com/models.json#${pointer}`
    const fetcher = (): Promise<Response> => Promise.resolve(new Response(JSON.stringify(resource)))
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'modern',
      document: {
        openapi: '3.1.0',
        info: { title: 'Modern API', version: '1' },
        paths: {},
        components: { schemas: { Item: { $ref: ref } } },
      },
      fetch: fetcher,
    })
    const saved = await store.getEditableDocument('modern')
    expect(getValueAtPath(saved, ['components', 'schemas', 'Item', '$ref'])).toBe(ref)
    const reloaded = createWorkspaceStore()
    await reloaded.addDocument({ name: 'modern', document: saved ?? {}, fetch: fetcher })
    expect(
      getValueAtPath(reloaded.workspace.documents.modern, ['components', 'schemas', 'Item', '$ref-value', 'type']),
    ).toStrictEqual(['string', 'null'])
  })
})
