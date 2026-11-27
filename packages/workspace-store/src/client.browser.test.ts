// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://example.com/docs/" }

import { isObject } from '@scalar/helpers/object/is-object'
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
    const error = vi.spyOn(console, 'error').mockReturnValue(undefined)
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
      expect(error.mock.calls[0]?.[2]).toBeInstanceOf(Error)
      expect(store.exportWorkspace()).toStrictEqual(snapshot)
    } finally {
      error.mockRestore()
    }
  })

  it.each(['base', 'Overlay'])(
    'shows a load-failed entry when the %s cannot be fetched on first add',
    async (source) => {
      const store = createWorkspaceStore()
      const url = 'https://example.com/openapi.yaml'
      const overlayUrl = 'https://example.com/overlays/partner.yaml'
      const unavailable = source === 'base' ? url : overlayUrl
      const fetchDocument: typeof fetch = (input) =>
        Promise.resolve(
          input === unavailable
            ? new Response(null, { status: 404 })
            : Response.json(input === url ? overlayBase : partnerOverlay),
        )
      const error = vi.spyOn(console, 'error').mockReturnValue(undefined)

      try {
        expect(
          await store.addDocument({ name: 'partner', url, overlays: [{ url: overlayUrl }], fetch: fetchDocument }),
        ).toBe(false)
        const failed = getOpenApiDocument(store, 'partner')
        expect(failed?.info.title).toBe("Document 'partner' could not be loaded")
        expect(failed?.['x-scalar-original-document-hash']).toBe('not-a-hash')
      } finally {
        error.mockRestore()
      }
    },
  )

  it('keeps the existing document when an Overlay rebase exceeds the action limit', async () => {
    const store = createWorkspaceStore()
    const input = { name: 'partner', document: overlayBase }
    expect(await store.addDocument(input)).toBe(true)
    const baseline = store.exportDocument('partner', 'json')
    const { extends: _extends, ...inlineOverlay } = partnerOverlay
    const document = {
      ...inlineOverlay,
      actions: Array.from({ length: 1_001 }, () => ({ target: '$.info.title', update: 'New title' })),
    }

    expect(await store.rebaseDocument({ ...input, overlays: [{ document }] })).toStrictEqual({
      ok: false,
      type: 'OVERLAY_FAILED',
      message: "Failed to compose document 'partner': Overlay 1: Overlay composition exceeded its action limit",
    })
    expect(store.exportDocument('partner', 'json')).toBe(baseline)
  })

  it('checks plugin detectors before requesting Overlay sources', async () => {
    const store = createWorkspaceStore({
      documentTypes: [{ type: 'other', detect: (document) => document['x-format'] === 'other', traverse: () => [] }],
    })
    const fetchDocument = vi.fn<typeof fetch>()
    const error = vi.spyOn(console, 'error').mockReturnValue(undefined)
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
      expect(getOpenApiDocument(store, 'plugin')?.info.title).toBe("Document 'plugin' could not be loaded")
    } finally {
      error.mockRestore()
    }
  })

  it('applies a mixed-version Overlay list before upgrading the description on add and rebase', async () => {
    const store = createWorkspaceStore()
    const document = {
      ...overlayBase,
      openapi: '3.0.4',
      components: { schemas: { Label: { type: 'string' }, Name: { type: 'string' } } },
      'x-items': [[1]],
    }
    const input = { name: 'partner', document }
    const info = { title: 'Partner Overlay', version: '1' }
    const overlays = [
      {
        document: {
          overlay: '1.0.0',
          info,
          actions: [
            { target: "$['x-items']", update: [2] },
            { target: '$.components.schemas.Label', update: { nullable: true } },
          ],
        },
      },
      {
        document: {
          overlay: '1.1.0',
          info,
          actions: [
            { target: "$['x-items']", update: [3] },
            { target: '$.components.schemas.Name', copy: '$.components.schemas.Label' },
          ],
        },
      },
      {
        document: {
          overlay: '1.2.0',
          info,
          actions: [{ target: '$.components.schemas[?@.nullable == true]', update: { description: 'Nullable' } }],
        },
      },
    ]
    expect(await store.addDocument({ ...input, overlays })).toBe(true)

    const getNameSchema = (): unknown =>
      getResolvedRef(getOpenApiDocument(store, input.name)?.components?.schemas?.Name)
    const getExport = (): Record<string, unknown> => {
      const exported = store.exportDocument(input.name, 'json')
      assert(exported)
      const parsed: unknown = JSON.parse(exported)
      assert(isObject(parsed))
      return parsed
    }
    expect(getNameSchema()).toStrictEqual({ type: ['string', 'null'], description: 'Nullable' })
    expect(getExport()['x-items']).toStrictEqual([[1], [2], 3])

    const rebase = await store.rebaseDocument({
      ...input,
      document: { ...document, 'x-items': [[0]] },
      overlays,
    })
    assert(rebase.ok)
    await rebase.applyChanges({ resolvedConflicts: [] })
    expect(getNameSchema()).toStrictEqual({ type: ['string', 'null'], description: 'Nullable' })
    const beforeFailure = getExport()
    expect(beforeFailure['x-items']).toStrictEqual([[0], [2], 3])

    const failed = await store.rebaseDocument({
      ...input,
      overlays: [
        ...overlays,
        { document: { overlay: '1.0.0', info, actions: [{ target: '$.info.title', remove: true }] } },
      ],
    })
    assert(!failed.ok)
    expect(failed.type).toBe('OVERLAY_FAILED')
    expect(failed.message).toContain('Overlay 1.0 targets must select only objects or arrays')
    expect(getExport()).toStrictEqual(beforeFailure)
  })

  it('returns Overlay diagnostics when rebasing and when the same sources are unchanged', async () => {
    const store = createWorkspaceStore()
    const input = { name: 'partner', document: overlayBase, documentSource: 'https://example.com/openapi.yaml' }
    const source = { document: partnerOverlay, documentSource: 'https://example.com/overlays/partner.yaml' }
    expect(await store.addDocument({ ...input, overlays: [source] })).toBe(true)
    const target = '$.info.missing'
    const updated = {
      ...source,
      document: {
        ...partnerOverlay,
        actions: [
          ...partnerOverlay.actions,
          { target, remove: true },
          { target: '$.info.title', update: 'Public API' },
        ],
      },
    }
    const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    try {
      const rebase = await store.rebaseDocument({ ...input, overlays: [updated] })
      const expected = [{ overlayIndex: 0, actionIndex: partnerOverlay.actions.length, target }]
      assert(rebase.ok)
      expect(rebase.overlayDiagnostics).toStrictEqual(expected)
      await rebase.applyChanges({ resolvedConflicts: [] })
      expect(getOpenApiDocument(store, 'partner')?.info.title).toBe('Public API')

      const unchanged = await store.rebaseDocument({ ...input, overlays: [updated] })
      assert(!unchanged.ok)
      expect(unchanged.type).toBe('NO_CHANGES_DETECTED')
      expect(unchanged.overlayDiagnostics).toStrictEqual(expected)

      const invalid = { ...source, document: { ...partnerOverlay, extends: './other-api.yaml' } }
      const failed = await store.rebaseDocument({ ...input, overlays: [invalid] })
      assert(!failed.ok)
      expect(failed.type).toBe('OVERLAY_FAILED')
      expect(failed.message).toContain('which does not identify the base description')
    } finally {
      warn.mockRestore()
    }
  })

  it('uses the active proxy for composed rebases and the legacy transport for plain rebases', async () => {
    const store = createWorkspaceStore({ meta: { 'x-scalar-active-proxy': '/proxy' } })
    const url = 'https://example.com/openapi.yaml'
    const overlayUrl = 'https://example.com/overlays/partner.yaml'
    const source = { document: overlayBase, documentSource: url }
    expect(await store.addDocument({ name: 'plain', ...source })).toBe(true)
    expect(
      await store.addDocument({
        name: 'composed',
        ...source,
        overlays: [{ document: partnerOverlay, documentSource: overlayUrl }],
      }),
    ).toBe(true)

    const proxiedBase = `/proxy?scalar_url=${encodeURIComponent(url)}`
    const proxiedOverlay = `/proxy?scalar_url=${encodeURIComponent(overlayUrl)}`
    const fetchDocument = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((input) =>
        Promise.resolve(Response.json(input === proxiedOverlay ? partnerOverlay : overlayBase)),
      )
    try {
      const plain = await store.rebaseDocument({ name: 'plain', url })
      const composed = await store.rebaseDocument({ name: 'composed', url, overlays: [{ url: overlayUrl }] })
      assert(!plain.ok && !composed.ok)
      expect(plain.type).toBe('NO_CHANGES_DETECTED')
      expect(composed.type).toBe('NO_CHANGES_DETECTED')
      expect(fetchDocument.mock.calls.map(([input]) => input)).toStrictEqual([url, proxiedBase, proxiedOverlay])

      const customFetch = vi.fn<typeof fetch>((input) =>
        Promise.resolve(Response.json(input === overlayUrl ? partnerOverlay : overlayBase)),
      )
      await store.rebaseDocument({ name: 'composed', url, overlays: [{ url: overlayUrl }], fetch: customFetch })
      expect(customFetch.mock.calls.map(([input]) => input)).toStrictEqual([url, overlayUrl])
      expect(fetchDocument).toHaveBeenCalledTimes(3)
    } finally {
      fetchDocument.mockRestore()
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

  it('refreshes Overlay inputs and active overrides while preserving unsaved edits', async () => {
    const store = createWorkspaceStore()
    const input = {
      name: 'partner',
      document: overlayBase,
      documentSource: 'https://example.com/openapi.yaml',
    }
    const overlaySource = { document: partnerOverlay, documentSource: 'https://example.com/overlays/partner.yaml' }
    expect(
      await store.addDocument({ ...input, overlays: [overlaySource], overrides: { info: { title: 'First' } } }),
    ).toBe(true)
    const active = getOpenApiDocument(store, 'partner')!
    active.info.description = 'Unsaved local edit'
    expect(active.info.title).toBe('First')

    const revised = {
      ...overlaySource,
      document: { ...partnerOverlay, info: { ...partnerOverlay.info, version: '2' } },
    }
    const result = await store.rebaseDocument({
      ...input,
      overlays: [revised],
      overrides: { info: { title: 'Second' } },
    })
    assert(result.ok)
    expect(result.changes).toStrictEqual([])
    expect(result.conflicts).toStrictEqual([])
    await result.applyChanges({ resolvedConflicts: [] })
    expect(getOpenApiDocument(store, 'partner')?.info.title).toBe('Second')
    expect(getOpenApiDocument(store, 'partner')?.info.description).toBe('Unsaved local edit')
    expect(JSON.parse(store.exportDocument('partner', 'json')!).info).toStrictEqual(overlayBase.info)
    const hydrated = createWorkspaceStore()
    hydrated.loadWorkspace(JSON.parse(JSON.stringify(store.exportWorkspace())))
    expect(getOpenApiDocument(hydrated, 'partner')?.info.title).toBe('Second')

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

  it('keeps the hashes and content of inline inputs aligned during asynchronous loading', async () => {
    const store = createWorkspaceStore()
    const document = structuredClone(overlayBase)
    const first = {
      overlay: '1.2.0',
      info: { title: 'First', version: '1' },
      actions: [{ target: '$.info.version', update: '2' }],
    }
    const input = { name: 'partner', document, documentSource: 'https://example.com/openapi.yaml' }
    const url = 'https://example.com/overlays/partner.yaml'
    const loaded = await store.addDocument({
      ...input,
      overlays: [{ document: first }, { url }],
      fetch: () => {
        document.info.title = 'Changed while loading'
        first.actions[0]!.update = '3'
        return Promise.resolve(Response.json(partnerOverlay))
      },
    })
    expect(loaded).toBe(true)
    expect(getOpenApiDocument(store, 'partner')?.info.title).toBe('Partner API')
    expect(getOpenApiDocument(store, 'partner')?.info.version).toBe('2')
    const rebase = await store.rebaseDocument({
      ...input,
      document: overlayBase,
      overlays: [{ document: { ...first, actions: [{ target: '$.info.version', update: '2' }] } }, { url }],
      fetch: () => Promise.resolve(Response.json(partnerOverlay)),
    })
    assert(!rebase.ok)
    expect(rebase.type).toBe('NO_CHANGES_DETECTED')
  })

  it('uses a redirected retrieval URI for both Overlay identity and OpenAPI references', async () => {
    const store = createWorkspaceStore()
    const url = 'https://example.com/alias/openapi.yaml'
    const retrieved = 'https://example.com/final/openapi.yaml'
    const schemaUrl = 'https://example.com/final/pet.json'
    const redirected = Response.json({
      ...overlayBase,
      components: { schemas: { Pet: { $ref: './pet.json' } } },
    })
    Object.defineProperties(redirected, { url: { value: retrieved }, redirected: { value: true } })
    const schema = { type: 'object', properties: { name: { type: 'string' } } }
    const fetchDocument = vi.fn<typeof fetch>((input) => {
      if (input === url) {
        return Promise.resolve(redirected)
      }
      return Promise.resolve(input === schemaUrl ? Response.json(schema) : new Response(null, { status: 404 }))
    })

    expect(
      await store.addDocument({
        name: 'partner',
        url,
        fetch: fetchDocument,
        overlays: [
          {
            document: { ...partnerOverlay, extends: './openapi.yaml' },
            documentSource: 'https://example.com/final/partner.yaml',
          },
        ],
      }),
    ).toBe(true)
    expect(fetchDocument.mock.calls.map(([input]) => input)).toStrictEqual([url, schemaUrl])
    expect(getResolvedRef(getOpenApiDocument(store, 'partner')?.components?.schemas?.Pet)).toStrictEqual(schema)
  })

  it('applies Overlay rebase server removals to both the active document and the export', async () => {
    const store = createWorkspaceStore()
    const document = { ...overlayBase, servers: [{ url: 'https://old.example.com' }] }
    const input = { name: 'partner', document, documentSource: 'https://example.com/openapi.yaml' }
    const source = { document: partnerOverlay, documentSource: 'https://example.com/overlays/partner.yaml' }
    expect(await store.addDocument({ ...input, overlays: [source] })).toBe(true)
    expect(getOpenApiDocument(store, 'partner')?.servers?.map(({ url }) => url)).toStrictEqual([
      'https://old.example.com',
    ])

    const rebase = await store.rebaseDocument({
      ...input,
      overlays: [
        {
          ...source,
          document: { ...partnerOverlay, actions: [...partnerOverlay.actions, { target: '$.servers', remove: true }] },
        },
      ],
    })
    assert(rebase.ok)
    await rebase.applyChanges({ resolvedConflicts: [] })
    expect(getOpenApiDocument(store, 'partner')?.servers).toBeUndefined()
    expect(JSON.parse(store.exportDocument('partner', 'json')!).servers).toBeUndefined()
  })
})
