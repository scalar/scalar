// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://example.com/docs/" }

import { getOpenApiDocument } from '@test/helpers'
import { overlayBase, partnerOverlay } from '@test/overlays'
import { assert, describe, expect, it, vi } from 'vitest'
import YAML from 'yaml'

import { createWorkspaceStore } from '@/client'
import { getPathItemOperation } from '@/helpers/for-each-path-item-operation'
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

  it('composes URL and inline Overlays into the document and both exports', async () => {
    const store = createWorkspaceStore()
    const fetchDocument = vi.fn<typeof fetch>((input) => {
      const sources: Record<string, string> = {
        'openapi.yaml': YAML.stringify(overlayBase),
        'overlays/partner.yaml': YAML.stringify(partnerOverlay),
      }
      const body = sources[String(input)]
      return Promise.resolve(body ? new Response(body) : new Response('', { status: 404 }))
    })

    expect(
      await store.addDocument({
        name: 'partner',
        url: 'openapi.yaml',
        fetch: fetchDocument,
        overlays: [
          { url: 'overlays/partner.yaml' },
          {
            document: {
              ...partnerOverlay,
              extends: '../openapi.yaml',
              actions: [{ target: "$.tags[?@.name == 'Partner'].name", update: 'External' }],
            },
            documentSource: 'https://example.com/docs/overlays/external.yaml',
          },
        ],
      }),
    ).toBe(true)

    expect(fetchDocument.mock.calls.map(([source]) => source)).toStrictEqual(['openapi.yaml', 'overlays/partner.yaml'])
    const document = getOpenApiDocument(store, 'partner')
    expect(getPathItemOperation(document?.paths?.['/internal'], 'get')).toBeUndefined()
    const response = getResolvedRef(getPathItemOperation(document?.paths?.['/pets'], 'get'))?.responses?.['200']
    expect(getResolvedRef(response)?.content?.['application/json']?.examples).toStrictEqual({
      partner: { value: { name: 'Rufus' } },
    })
    expect(document?.tags?.map((tag) => tag.name)).toStrictEqual(['Public', 'External'])
    const originalResponse = overlayBase.paths['/pets'].get.responses['200']
    const expected = {
      ...overlayBase,
      tags: [{ name: 'Public' }, { name: 'External' }],
      paths: {
        ...overlayBase.paths,
        '/internal': {},
        '/pets': {
          get: {
            tags: ['Public'],
            responses: {
              '200': {
                ...originalResponse,
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                    examples: { partner: { value: { name: 'Rufus' } } },
                  },
                },
              },
            },
          },
        },
      },
    }
    expect(JSON.parse(store.exportDocument('partner', 'json')!)).toStrictEqual(expected)
    expect(YAML.parse(store.exportDocument('partner', 'yaml')!)).toStrictEqual(expected)
  })

  it('keeps the previous workspace entry when a later Overlay action fails', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'partner', document: overlayBase })
    const snapshot = store.exportWorkspace()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(
        await store.addDocument({
          name: 'partner',
          document: overlayBase,
          overlays: [
            {
              document: {
                ...partnerOverlay,
                extends: 'https://example.com/docs/openapi.yaml',
                actions: [...partnerOverlay.actions, { target: '$.info.title', update: {} }],
              },
            },
          ],
          documentSource: 'https://example.com/docs/openapi.yaml',
        }),
      ).toBe(false)
      expect(error.mock.calls[0]?.[1]).toBeInstanceOf(Error)
      expect(store.exportWorkspace()).toStrictEqual(snapshot)
    } finally {
      error.mockRestore()
    }
  })

  it('checks plugin detectors before requesting Overlay sources', async () => {
    const store = createWorkspaceStore({
      documentTypes: [{ type: 'other', detect: (document) => document['x-format'] === 'other', traverse: () => [] }],
    })
    const fetchDocument = vi.fn<typeof fetch>()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(
        await store.addDocument({
          name: 'plugin',
          document: { ...overlayBase, 'x-format': 'other' },
          fetch: fetchDocument,
          overlays: [{ url: 'https://example.com/partner.yaml' }],
        }),
      ).toBe(false)
      expect(fetchDocument.mock.calls).toStrictEqual([])
      expect(store.workspace.documents.plugin).toBeUndefined()
    } finally {
      error.mockRestore()
    }
  })

  it('hydrates a single append and rebases only when Overlay inputs are provided again', async () => {
    const store = createWorkspaceStore()
    const input = {
      name: 'partner',
      document: overlayBase,
      documentSource: 'https://example.com/openapi.yaml',
    }
    const overlaySource = { document: partnerOverlay, documentSource: 'https://example.com/overlays/partner.yaml' }
    expect(await store.addDocument({ ...input, overlays: [overlaySource] })).toBe(true)
    const hydrated = createWorkspaceStore()
    hydrated.loadWorkspace(JSON.parse(JSON.stringify(store.exportWorkspace())))

    expect(getOpenApiDocument(hydrated, 'partner')?.tags?.map((tag) => tag.name)).toStrictEqual(['Public', 'Partner'])
    const rebase = await hydrated.rebaseDocument(input)
    assert(!rebase.ok)
    expect(rebase.type).toBe('OVERLAYS_REQUIRED')

    const updated = {
      ...partnerOverlay,
      actions: [...partnerOverlay.actions.slice(0, -1), { target: '$.tags', update: { name: 'External' } }],
    }
    const result = await hydrated.rebaseDocument({ ...input, overlays: [{ ...overlaySource, document: updated }] })
    assert(result.ok)
    await result.applyChanges({ resolvedConflicts: [] })
    expect(getOpenApiDocument(hydrated, 'partner')?.tags?.map((tag) => tag.name)).toStrictEqual(['Public', 'External'])

    const uncomposed = await hydrated.rebaseDocument({ ...input, overlays: [] })
    assert(uncomposed.ok)
    await uncomposed.applyChanges({ resolvedConflicts: [] })
    expect(getOpenApiDocument(hydrated, 'partner')?.tags?.map((tag) => tag.name)).toStrictEqual(['Public'])
    const unchanged = await hydrated.rebaseDocument(input)
    assert(!unchanged.ok)
    expect(unchanged.type).toBe('NO_CHANGES_DETECTED')
  })

  it('records changes to Overlay inputs that leave the description unchanged', async () => {
    const store = createWorkspaceStore()
    const input = {
      name: 'partner',
      document: overlayBase,
      documentSource: 'https://example.com/openapi.yaml',
    }
    const overlaySource = { document: partnerOverlay, documentSource: 'https://example.com/overlays/partner.yaml' }
    expect(await store.addDocument({ ...input, overlays: [overlaySource] })).toBe(true)

    const revised = {
      ...overlaySource,
      document: { ...partnerOverlay, info: { ...partnerOverlay.info, version: '2' } },
    }
    const result = await store.rebaseDocument({ ...input, overlays: [revised] })
    assert(result.ok)
    expect(result.changes).toStrictEqual([])
    expect(result.conflicts).toStrictEqual([])
    await result.applyChanges({ resolvedConflicts: [] })

    const unchanged = await store.rebaseDocument({ ...input, overlays: [revised] })
    assert(!unchanged.ok)
    expect(unchanged.type).toBe('NO_CHANGES_DETECTED')
  })

  it('selects authored OpenAPI locations before upgrading the description', async () => {
    const store = createWorkspaceStore()
    const document = {
      swagger: '2.0',
      info: { title: 'Legacy API', version: '1' },
      paths: {},
      definitions: { Item: { type: 'object', description: 'Internal description' } },
    }
    const { extends: _extends, ...overlay } = partnerOverlay
    expect(
      await store.addDocument({
        name: 'legacy',
        document,
        overlays: [
          {
            document: {
              ...overlay,
              actions: [{ target: '$.definitions.Item.description', update: 'Partner description' }],
            },
          },
        ],
      }),
    ).toBe(true)

    const upgraded = getOpenApiDocument(store, 'legacy')
    expect(getResolvedRef(upgraded?.components?.schemas?.Item)?.description).toBe('Partner description')
    expect(JSON.parse(store.exportDocument('legacy', 'json')!).definitions.Item.description).toBe('Partner description')
  })
})
