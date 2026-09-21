// @vitest-environment node
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { unpackProxyShallow } from '@scalar/workspace-store/helpers/unpack-proxy'
import { type ServerWorkspaceStore, createServerWorkspaceStore } from '@scalar/workspace-store/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderApiReference, renderApiReferenceToString } from './ssr'

const createStore = (): Promise<ServerWorkspaceStore> =>
  createServerWorkspaceStore({
    mode: 'ssr',
    baseUrl: 'https://docs.example.com/chunks',
    documents: [
      {
        name: 'pets',
        document: {
          openapi: '3.1.0',
          info: { title: 'Prepared pets', version: '1.0.0' },
          servers: [{ url: 'https://original.example.com' }],
          tags: [{ name: 'Pets' }],
          paths: {
            '/pets': {
              get: {
                tags: ['Pets'],
                summary: 'List prepared pets',
                responses: {
                  '200': {
                    description: 'Pet response',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PetAlias' } } },
                  },
                },
              },
            },
          },
          components: {
            schemas: {
              PetAlias: { $ref: '#/components/schemas/Pet' },
              Pet: {
                type: 'object',
                properties: {
                  petName: { type: 'string', example: 'Fido' },
                  parent: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
      },
    ],
  })

const config = { slug: 'pets', url: 'https://docs.example.com/pets.json' }

afterEach(() => vi.unstubAllGlobals())

describe('ssr-prepared-document', () => {
  it('renders the resolved document without fetching and preserves the browser configuration', async () => {
    const store = await createStore()
    const fetch = vi.fn(() => Promise.reject(new Error('Prepared rendering must not fetch')))
    vi.stubGlobal('fetch', fetch)
    const html = await renderApiReference({ config, document: store.getResolvedDocument('pets'), css: '' })

    expect(fetch).not.toHaveBeenCalled()
    expect(html).toContain('List prepared pets')
    expect(html).toContain('petName')
    expect(html).toContain('Fido')
    const hydrationConfig = html.split("Scalar.createApiReference('#app', ")[1]?.split(')</script>')[0]
    expect(JSON.parse(hydrationConfig ?? '')).toStrictEqual(config)
    expect(html).not.toContain('$ref-value')
    expect(store.getWorkspace().documents.pets).toHaveProperty(['paths', '/pets', 'get'], {
      $ref: 'https://docs.example.com/chunks/pets/operations/~1pets/get#',
      $global: true,
    })
  })

  it('isolates concurrent renders from the reusable document and each other', async () => {
    const store = await createStore()
    const document = store.getResolvedDocument('pets')
    const before = JSON.stringify(unpackProxyShallow(document))
    const [first, second] = await Promise.all(
      ['https://first.example.com', 'https://second.example.com'].map((url) =>
        renderApiReferenceToString({ ...config, servers: [{ url }] }, { document }),
      ),
    )

    expect(first).toContain('https://first.example.com')
    expect(first).not.toContain('https://second.example.com')
    expect(second).toContain('https://second.example.com')
    expect(second).not.toContain('https://first.example.com')
    expect(JSON.stringify(unpackProxyShallow(document))).toBe(before)
    const repeated = await renderApiReferenceToString(
      { ...config, servers: [{ url: 'https://first.example.com' }] },
      { document },
    )
    expect(repeated).toBe(first)
  })

  it('uses updated prepared data on the next render', async () => {
    const store = await createStore()
    const document = store.getResolvedDocument('pets')
    if (!document) {
      throw new Error('Expected a prepared document')
    }
    expect(await renderApiReferenceToString(config, { document })).toContain('Prepared pets')
    document.info.title = 'Updated prepared pets'
    const property = getValueAtPath<Record<string, unknown>>(document, [
      'components',
      'schemas',
      'Pet',
      'properties',
      'petName',
    ])
    if (!property) {
      throw new Error('Expected the prepared petName schema')
    }
    property.example = 'Rex'
    const updated = await renderApiReferenceToString(config, { document })
    expect(updated).toContain('Updated prepared pets')
    expect(updated).toContain('Rex')
    expect(updated).not.toContain('Fido')
  })

  it('matches ordinary rendering including authored method order and the original version badge', async () => {
    const operation = { tags: ['Pets'], responses: { '200': { description: 'OK' } } }
    const description = {
      openapi: '3.0.3',
      info: { title: 'Equivalent rendering', version: '1' },
      tags: [{ name: 'Pets' }],
      paths: { '/pets': { post: operation, put: operation, get: operation } },
    }
    const store = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://docs.example.com/chunks',
      documents: [{ name: 'pets', document: structuredClone(description) }],
    })
    const configuration = { slug: 'pets', content: description }
    const ordinary = await renderApiReferenceToString(configuration)
    const prepared = await renderApiReferenceToString(configuration, { document: store.getResolvedDocument('pets') })
    expect(prepared).toBe(ordinary)
  })

  it('rejects a missing or mismatched configured slug', async () => {
    const store = await createStore()
    const document = store.getResolvedDocument('pets')
    for (const slug of [undefined, 'different']) {
      await expect(renderApiReference({ config: { ...config, slug }, document, css: '' })).rejects.toThrow(
        'a slug matching its navigation name',
      )
    }
  })

  it('matches the reference normalization of explicit slugs', async () => {
    const store = await createStore()
    const document = store.getResolvedDocument('pets')
    const html = await renderApiReferenceToString({ ...config, slug: 'PETS' }, { document })
    expect(html).toContain('List prepared pets')
    await expect(
      renderApiReferenceToString({ ...config, slug: 'PETS', title: 'Preserved slug' }, { document }),
    ).rejects.toThrow('a slug matching its navigation name')
  })

  it('requires a browser source and rejects multi-source configurations', async () => {
    const store = await createStore()
    const document = store.getResolvedDocument('pets')
    await expect(renderApiReferenceToString({ slug: 'pets', url: '   ' }, { document })).rejects.toThrow(
      'config.url or config.content for browser hydration',
    )
    await expect(renderApiReferenceToString({ ...config, sources: [config] }, { document })).rejects.toThrow(
      'a single-source config',
    )
  })
})
