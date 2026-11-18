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
  it.each(['2.0', '3.0.3'])(
    'preserves upgraded response headers in serialized %s server component chunks',
    async (version) => {
      const response = {
        description: 'OK',
        headers: {
          Count:
            version === '2.0'
              ? { type: 'integer', minimum: 0 }
              : { schema: { type: 'integer', minimum: 0, nullable: true } },
        },
      }
      const server = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com/docs',
        documents: [
          {
            name: 'legacy',
            document: {
              ...(version === '2.0'
                ? { swagger: version, responses: { Success: response } }
                : { openapi: version, components: { responses: { Success: response } } }),
              info: { title: 'Legacy', version: '1' },
              paths: {
                '/items': {
                  get: {
                    responses: {
                      '200': { $ref: version === '2.0' ? '#/responses/Success' : '#/components/responses/Success' },
                    },
                  },
                },
              },
            },
          },
        ],
      })
      expect(getValueAtPath(server.getWorkspace().documents.legacy, ['x-scalar-upgrade'])).toBeUndefined()
      const client = createWorkspaceStore()
      await client.addDocument({
        name: 'legacy',
        document: JSON.parse(JSON.stringify(server.getWorkspace().documents.legacy)),
        fetch: (input) =>
          Promise.resolve(
            new Response(JSON.stringify(server.get(new URL(String(input)).pathname.slice('/docs'.length)))),
          ),
      })
      await client.resolve(['components', 'responses', 'Success'])
      await client.resolve(['paths', '/items', 'get'])
      expect(
        getValueAtPath(client.workspace.documents.legacy, [
          'components',
          'responses',
          'Success',
          '$ref-value',
          'headers',
          'Count',
          'schema',
        ]),
      ).toStrictEqual({ type: version === '2.0' ? 'integer' : ['integer', 'null'], minimum: 0 })
      expect(
        getValueAtPath(client.workspace.documents.legacy, [
          'paths',
          '/items',
          'get',
          '$ref-value',
          'responses',
          '200',
          '$ref-value',
          '$ref-value',
          'headers',
          'Count',
          'schema',
        ]),
      ).toStrictEqual({ type: version === '2.0' ? 'integer' : ['integer', 'null'], minimum: 0 })
      const saved = await client.getEditableDocument('legacy')
      expect(getValueAtPath(saved, ['x-scalar-upgrade'])).toBeUndefined()
    },
  )

  it('retains operation media types for lazy 2.0 external responses after server serialization and export', async () => {
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com/docs',
      documents: [
        {
          name: 'legacy',
          document: {
            swagger: '2.0',
            info: { title: 'Legacy', version: '1' },
            paths: {
              '/items': {
                get: {
                  produces: ['application/xml'],
                  responses: { '200': { $ref: 'https://example.com/response.json' } },
                },
              },
              '/local': { get: { produces: ['text/plain'], responses: { '200': { description: 'Local' } } } },
            },
          },
        },
      ],
    })
    const serialized = JSON.parse(JSON.stringify(server.getWorkspace().documents.legacy))
    expect(serialized['x-scalar-upgrade']).toStrictEqual({
      from: '2.0',
      locations: [
        {
          source: ['paths', '/local', 'get', 'responses', '200', 'schema'],
          output: ['paths', '/local', 'get', 'responses', '200', 'content', 'text/plain', 'schema'],
        },
      ],
      contexts: [{ path: ['paths', '/items', 'get'], consumes: ['application/json'], produces: ['application/xml'] }],
    })
    const fetcher = (input: RequestInfo | URL): Promise<Response> =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            String(input) === 'https://example.com/response.json'
              ? { description: 'Remote', schema: { type: 'string' }, headers: { Count: { type: 'integer' } } }
              : server.get(new URL(String(input)).pathname.slice('/docs'.length)),
          ),
        ),
      )
    const client = createWorkspaceStore()
    await client.addDocument({ name: 'legacy', document: serialized, fetch: fetcher })
    await client.resolve(['paths', '/items', 'get'])
    const responsePath = ['paths', '/items', 'get', '$ref-value', 'responses', '200', '$ref-value']
    expect(getValueAtPath(client.workspace.documents.legacy, [...responsePath, 'content'])).toStrictEqual({
      'application/xml': { schema: { type: 'string' } },
    })
    expect(getValueAtPath(client.workspace.documents.legacy, [...responsePath, 'headers', 'Count'])).toStrictEqual({
      schema: { type: 'integer' },
    })
    await client.resolve(['paths', '/local', 'get'])
    const saved = await client.getEditableDocument('legacy')
    const reloaded = createWorkspaceStore()
    await reloaded.addDocument({ name: 'legacy', document: saved ?? {}, fetch: fetcher })
    await reloaded.resolve(['paths', '/items', 'get'])
    expect(getValueAtPath(reloaded.workspace.documents.legacy, [...responsePath, 'content'])).toStrictEqual({
      'application/xml': { schema: { type: 'string' } },
    })
  })
})
