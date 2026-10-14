import { describe, expect, it } from 'vitest'

import type { LoaderPlugin, ResolveResult } from './bundle'
import { bundleWithDiagnostics } from './bundle-with-diagnostics'
import { fetchUrls } from './plugins/fetch-urls'

/** In-memory source transport records actual loads, including failures. */
const sources = (documents: Record<string, unknown>): { plugin: LoaderPlugin; calls: string[] } => {
  const calls: string[] = []
  return {
    calls,
    plugin: {
      type: 'loader',
      validate: () => true,
      exec: (uri): Promise<ResolveResult> => {
        calls.push(uri)
        return Promise.resolve(
          Object.hasOwn(documents, uri)
            ? { ok: true, data: structuredClone(documents[uri]), raw: JSON.stringify(documents[uri]) }
            : { ok: false },
        )
      },
    },
  }
}

describe('bundle-with-diagnostics', () => {
  it('reports authored local and external failures and skips pruning', async () => {
    const loader = sources({ '/external.json': { existing: { type: 'string' } } })
    const input = {
      local: { $ref: '#/absent' },
      external: { $ref: './missing.json' },
      fragment: { $ref: './external.json#/absent' },
    }
    const result = await bundleWithDiagnostics(input, {
      origin: '/root.json',
      plugins: [loader.plugin],
      treeShake: true,
      compress: (value) => (value.includes('missing') ? 'missing' : 'external'),
    })
    expect(result.diagnostics).toStrictEqual([
      { kind: 'missing-target', reference: '#/absent', source: '/root.json', pointer: '#/local/$ref' },
      { kind: 'unresolved-document', reference: './missing.json', source: '/root.json', pointer: '#/external/$ref' },
      {
        kind: 'missing-target',
        reference: './external.json#/absent',
        source: '/root.json',
        pointer: '#/fragment/$ref',
      },
    ])
    expect(result.document).toStrictEqual({
      local: { $ref: '#/absent' },
      external: { $ref: './missing.json' },
      fragment: { $ref: './external.json#/absent' },
      'x-ext': { external: { existing: { type: 'string' } } },
    })
    expect(result.document['fragment'].$ref).toBe('./external.json#/absent')
    expect(result.complete).toBe(false)
    expect(result.pruning).toBe('skipped')
    expect(loader.calls).toStrictEqual(['/missing.json', '/external.json'])
  })

  it('retains unpruned external data when a nested reference fails', async () => {
    const loader = sources({ '/external.json': { used: { $ref: '#/absent' }, unused: { type: 'string' } } })
    const result = await bundleWithDiagnostics(
      { $ref: './external.json#/used' },
      { origin: '/root.json', plugins: [loader.plugin], treeShake: true, compress: () => 'external' },
    )
    expect(result.diagnostics).toStrictEqual([
      { kind: 'missing-target', reference: '#/absent', source: '/external.json', pointer: '#/used/$ref' },
    ])
    expect(result.document['x-ext'].external.unused).toStrictEqual({ type: 'string' })
    expect(result.pruning).toBe('skipped')
  })

  it('prunes only after successful resolution and does not refetch or mutate cached sources', async () => {
    const external = { used: { $ref: '#/other' }, other: { type: 'string' }, unused: true }
    const loader = sources({ '/external.json': external })
    const cache = new Map<string, Promise<ResolveResult>>()
    for (const treeShake of [true, false]) {
      const result = await bundleWithDiagnostics(
        { $ref: './external.json#/used' },
        { origin: '/root.json', plugins: [loader.plugin], cache, treeShake, compress: () => 'external', urlMap: true },
      )
      expect(result.diagnostics).toStrictEqual([])
      expect(result.pruning).toBe(treeShake ? 'applied' : 'disabled')
      expect(result.document['x-ext'].external).toStrictEqual({
        used: { $ref: '#/x-ext/external/other' },
        other: { type: 'string' },
        ...(!treeShake && { unused: true }),
      })
    }
    expect(loader.calls).toStrictEqual(['/external.json'])
    expect(await cache.get('/external.json')).toStrictEqual({ ok: true, data: external, raw: JSON.stringify(external) })
  })

  it('keeps root failures and hook failures fatal', async () => {
    await expect(bundleWithDiagnostics('/absent.json', { plugins: [], treeShake: false })).rejects.toThrow(
      'Failed to resolve input',
    )
    await expect(
      bundleWithDiagnostics(
        {},
        {
          plugins: [],
          treeShake: false,
          hooks: {
            onBeforeNodeProcess: () => {
              throw new Error('hook failed')
            },
          },
        },
      ),
    ).rejects.toThrow('hook failed')
  })

  it('reports malformed external documents without manufacturing a local pointer', async () => {
    const plugin = fetchUrls({ fetch: async () => new Response('{ broken') })
    const result = await bundleWithDiagnostics(
      { $ref: 'https://example.com/broken.json' },
      { plugins: [plugin], treeShake: false },
    )
    expect(result.document['$ref']).toBe('https://example.com/broken.json')
    expect(result.diagnostics).toStrictEqual([
      { kind: 'unresolved-document', reference: 'https://example.com/broken.json', source: '/', pointer: '#/$ref' },
    ])
  })

  it('does not inspect schema instance values or keyword-named schema properties as document objects', async () => {
    const literal = { $ref: '/literal.json', $id: '/shadow.json' }
    const input = {
      openapi: '3.1.0',
      components: {
        schemas: {
          Test: {
            example: literal,
            examples: [literal],
            default: literal,
            enum: [literal],
            const: literal,
            'x-data': literal,
            properties: {
              examples: { $ref: '#/components/schemas/Target' },
              default: { $ref: '#/absent' },
              'x-name': { $ref: '#/components/schemas/Target' },
            },
          },
          Target: { type: 'string' },
        },
      },
      'x-data': literal,
    }
    const loader = sources({})
    const result = await bundleWithDiagnostics(input, {
      plugins: [loader.plugin],
      treeShake: false,
      traversal: 'document',
    })
    expect(loader.calls).toStrictEqual([])
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'missing-target',
        reference: '#/absent',
        source: '/',
        pointer: '#/components/schemas/Test/properties/default/$ref',
      },
    ])
    expect(result.document['components'].schemas.Test.example).toStrictEqual(literal)
  })

  it('processes real Example Object and callback references', async () => {
    const input = {
      openapi: '3.1.0',
      components: { examples: { Example: { $ref: '#/absent' } }, callbacks: { Callback: { $ref: '#/absent' } } },
    }
    const result = await bundleWithDiagnostics(input, { plugins: [], treeShake: false, traversal: 'document' })
    expect(result.diagnostics.map(({ pointer }) => pointer)).toStrictEqual([
      '#/components/examples/Example/$ref',
      '#/components/callbacks/Callback/$ref',
    ])
  })

  it('preserves inline and reusable AsyncAPI message-trait examples', async () => {
    const literal = { $ref: '/literal.json' }
    const input = {
      asyncapi: '3.0.0',
      components: {
        messageTraits: {
          Trait: { examples: [{ payload: literal }], headers: { properties: { real: { $ref: '#/absent' } } } },
        },
        messages: {
          Message: {
            traits: [{ examples: [{ payload: literal }] }, { $ref: '#/components/messageTraits/Trait' }],
            examples: [{ payload: literal }],
          },
        },
      },
    }
    const loader = sources({})
    const result = await bundleWithDiagnostics(input, {
      plugins: [loader.plugin],
      treeShake: false,
      traversal: 'document',
    })
    expect(loader.calls).toStrictEqual([])
    expect(result.diagnostics.map(({ pointer }) => pointer)).toStrictEqual([
      '#/components/messageTraits/Trait/headers/properties/real/$ref',
    ])
  })

  it('processes applicable schema and Path Item siblings', async () => {
    const input = {
      openapi: '3.1.0',
      components: {
        schemas: {
          Base: {},
          Derived: { $ref: '#/components/schemas/Base', properties: { sibling: { $ref: '#/missing-schema' } } },
        },
        pathItems: { Base: {} },
      },
      paths: {
        '/test': { $ref: '#/components/pathItems/Base', get: { responses: { '200': { $ref: '#/missing-response' } } } },
      },
    }
    const result = await bundleWithDiagnostics(input, { plugins: [], treeShake: false, traversal: 'document' })
    expect(result.diagnostics.map(({ reference }) => reference)).toStrictEqual([
      '#/missing-schema',
      '#/missing-response',
    ])
  })

  it('inherits schema context at an external fragment', async () => {
    const loader = sources({
      '/external.json': {
        arbitrary: { examples: [{ $ref: '/literal.json' }], properties: { child: { $ref: '#/absent' } } },
      },
    })
    const result = await bundleWithDiagnostics(
      { openapi: '3.1.0', components: { schemas: { External: { $ref: './external.json#/arbitrary' } } } },
      { origin: '/root.json', plugins: [loader.plugin], treeShake: false, traversal: 'document' },
    )
    expect(loader.calls).toStrictEqual(['/external.json'])
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'missing-target',
        reference: '#/absent',
        source: '/external.json',
        pointer: '#/arbitrary/properties/child/$ref',
      },
    ])
  })

  it('accepts recursive schemas, reference-only cycles, identifiers, anchors and escaped pointers', async () => {
    const input = {
      $id: 'https://example.com/root',
      $defs: {
        'a/b~c': { $anchor: 'item', properties: { self: { $ref: '#item' } } },
        A: { $ref: '#/$defs/B' },
        B: { $ref: '#/$defs/A' },
      },
      properties: { escaped: { $ref: '#/$defs/a~1b~0c' }, identifier: { $ref: 'https://example.com/root' } },
    }
    const result = await bundleWithDiagnostics(input, { plugins: [], treeShake: true, traversal: 'document' })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.complete).toBe(true)
  })

  it('accepts external cycles without refetching the root', async () => {
    const loader = sources({ '/root.json': { $ref: './external.json' }, '/external.json': { $ref: './root.json' } })
    const result = await bundleWithDiagnostics('/root.json', { plugins: [loader.plugin], treeShake: true })
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['/root.json', '/external.json'])
  })

  it('distinguishes intentionally preserved URLs from failures', async () => {
    const result = await bundleWithDiagnostics(
      { $ref: 'https://example.com/preserved' },
      { plugins: [], treeShake: true, preserveReference: () => true },
    )
    expect(result.document['$ref']).toBe('https://example.com/preserved')
    expect(result.diagnostics).toStrictEqual([])
    expect(result.complete).toBe(true)
  })

  it('reports repeated missing external anchors without rewriting them', async () => {
    const loader = sources({ '/external.json': { type: 'string' } })
    const input = { one: { $ref: '/external.json#missing' }, two: { $ref: '/external.json#missing' } }
    const result = await bundleWithDiagnostics(input, { plugins: [loader.plugin], treeShake: true })
    expect(result.diagnostics.map(({ pointer }) => pointer)).toStrictEqual(['#/one/$ref', '#/two/$ref'])
    expect(input.one.$ref).toBe('/external.json#missing')
    expect(input.two.$ref).toBe('/external.json#missing')
    expect(loader.calls).toStrictEqual(['/external.json'])
  })

  it('prunes using external schema identifiers and anchors without losing their dependencies', async () => {
    const loader = sources({
      '/external.json': {
        $id: 'https://example.com/schema',
        $defs: {
          Used: { $anchor: 'used', properties: { child: { $ref: '#/$defs/Child' } } },
          Child: { type: 'string' },
          Unused: {},
        },
      },
    })
    const result = await bundleWithDiagnostics(
      { $ref: '/external.json#used' },
      { plugins: [loader.plugin], treeShake: true, traversal: 'document', compress: () => 'external' },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.document['x-ext'].external).toStrictEqual({
      $id: 'https://example.com/schema',
      $defs: { Used: { $anchor: 'used', properties: { child: { $ref: '#/$defs/Child' } } }, Child: { type: 'string' } },
    })
  })

  it('resolves canonical identities from preloaded cache entries without fetching', async () => {
    const cache = new Map<string, Promise<ResolveResult>>([
      [
        '/schema.json',
        Promise.resolve({ ok: true, data: { $id: 'https://example.com/schema', type: 'string' }, raw: '' }),
      ],
    ])
    const loader = sources({})
    const result = await bundleWithDiagnostics(
      { $ref: 'https://example.com/schema' },
      { plugins: [loader.plugin], cache, treeShake: true },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual([])
  })

  it('preserves generic literal traversal unless document mode is requested', async () => {
    const result = await bundleWithDiagnostics({ example: { $ref: '#/absent' } }, { plugins: [], treeShake: false })
    expect(result.diagnostics.map(({ pointer }) => pointer)).toStrictEqual(['#/example/$ref'])
  })

  it('does not process ignored OpenAPI 3.0 Reference Object siblings', async () => {
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.0.3',
        components: {
          schemas: {
            Base: {},
            Derived: { $ref: '#/components/schemas/Base', properties: { ignored: { $ref: '/absent' } } },
          },
        },
      },
      { plugins: [], treeShake: false, traversal: 'document' },
    )
    expect(result.diagnostics).toStrictEqual([])
  })

  it('keeps global chunk references relative to the referring document', async () => {
    const loader = sources({ '/chunks/schema.json': { properties: { child: { $ref: '#/components/schemas/Child' } } } })
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        components: { schemas: { Split: { $ref: './chunks/schema.json', $global: true }, Child: { type: 'string' } } },
      },
      {
        origin: '/root.json',
        plugins: [loader.plugin],
        treeShake: true,
        traversal: 'document',
        compress: () => 'chunk',
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.document['x-ext'].chunk).toStrictEqual({
      properties: { child: { $ref: '#/components/schemas/Child' } },
    })
    const restored = await bundleWithDiagnostics(JSON.parse(JSON.stringify(result.document)), {
      plugins: [],
      treeShake: true,
      traversal: 'document',
    })
    expect(restored.diagnostics).toStrictEqual([])
    expect(restored.document).toStrictEqual(result.document)
  })

  it('honors lifecycle hooks while retaining authored diagnostics', async () => {
    const events: string[] = []
    const result = await bundleWithDiagnostics(
      { $ref: '/original' },
      {
        plugins: [
          {
            type: 'lifecycle',
            onResolveError: () => {
              events.push('error')
            },
          },
        ],
        treeShake: false,
        hooks: {
          onBeforeNodeProcess: (node) => {
            if (node.$ref === '/original') node.$ref = '/replacement'
          },
          onResolveStart: () => {
            events.push('start')
          },
          onAfterNodeProcess: () => {
            events.push('after')
          },
        },
      },
    )
    expect(events).toStrictEqual(['start', 'error', 'after'])
    expect(result.diagnostics).toStrictEqual([
      { kind: 'unresolved-document', reference: '/original', source: '/', pointer: '#/$ref' },
    ])
  })

  it('exposes an external fragment without interpreting adjacent literal data', async () => {
    const loader = sources({
      '/external.json': { examples: { selected: { type: 'string' }, literal: { $ref: '/never-load' } } },
    })
    const result = await bundleWithDiagnostics(
      { $ref: '/external.json#/examples/selected' },
      { plugins: [loader.plugin], traversal: 'document', treeShake: true },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['/external.json'])
  })

  it('preserves external AsyncAPI message-trait examples and checks their headers', async () => {
    const loader = sources({
      '/traits.json': {
        Trait: {
          examples: [{ payload: { $ref: '/literal' } }],
          headers: { properties: { real: { $ref: '#/absent' } } },
        },
      },
    })
    const result = await bundleWithDiagnostics(
      { asyncapi: '3.0.0', components: { messageTraits: { Trait: { $ref: '/traits.json#/Trait' } } } },
      { plugins: [loader.plugin], traversal: 'document', treeShake: false },
    )
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'missing-target',
        reference: '#/absent',
        source: '/traits.json',
        pointer: '#/Trait/headers/properties/real/$ref',
      },
    ])
    expect(loader.calls).toStrictEqual(['/traits.json'])
  })

  it('resolves URI-encoded fragments and reports escaped authored locations', async () => {
    const loader = sources({ '/external.json': { 'a b/c': { $ref: '#/absent' } } })
    const result = await bundleWithDiagnostics(
      { 'a/b~c': { $ref: '/external.json#/a%20b~1c' } },
      { plugins: [loader.plugin], treeShake: false },
    )
    expect(result.diagnostics).toStrictEqual([
      { kind: 'missing-target', reference: '#/absent', source: '/external.json', pointer: '#/a b~1c/$ref' },
    ])
    expect(result.document['a/b~c'].$ref.includes('/a%20b~1c')).toBe(true)
    const missing = await bundleWithDiagnostics({ 'a/b~c': { $ref: '#/missing' } }, { plugins: [], treeShake: false })
    expect(missing.diagnostics[0].pointer).toBe('#/a~1b~0c/$ref')
  })

  it('rejects malformed and non-object roots', async () => {
    const malformed = fetchUrls({ fetch: async () => new Response('{ malformed') })
    await expect(
      bundleWithDiagnostics('https://example.com/root', { plugins: [malformed], treeShake: true }),
    ).rejects.toThrow('Failed to resolve input')
    const loader = sources({ '/null.json': null })
    await expect(bundleWithDiagnostics('/null.json', { plugins: [loader.plugin], treeShake: true })).rejects.toThrow(
      'Failed to resolve input',
    )
  })

  it('ignores OpenAPI 3.2 Example Object dataValue references', async () => {
    const input = {
      openapi: '3.2.0',
      components: {
        examples: {
          Literal: { dataValue: { $ref: '/literal' } },
          Reference: { $ref: '#/components/examples/Literal' },
        },
      },
    }
    const loader = sources({})
    const result = await bundleWithDiagnostics(input, {
      plugins: [loader.plugin],
      traversal: 'document',
      treeShake: true,
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual([])
    expect(input.components.examples.Literal.dataValue).toStrictEqual({ $ref: '/literal' })
  })

  it('retains percent and hash characters in relocated pointer targets', async () => {
    const loader = sources({ '/external.json': { '%20#': { type: 'string' } } })
    const result = await bundleWithDiagnostics(
      { $ref: '/external.json#/%2520%23' },
      { plugins: [loader.plugin], treeShake: true, compress: () => 'external' },
    )
    expect(result.document['$ref']).toBe('#/x-ext/external/%2520%23')
    expect(result.document['x-ext'].external).toStrictEqual({ '%20#': { type: 'string' } })
    const restored = await bundleWithDiagnostics(JSON.parse(JSON.stringify(result.document)), {
      plugins: [],
      treeShake: true,
    })
    expect(restored.diagnostics).toStrictEqual([])
  })
  it('ignores Paths and Responses extensions but resolves named component entries', async () => {
    const loader = sources({})
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        paths: {
          'x-data': { $ref: '/literal' },
          '/test': { get: { responses: { 'x-data': { $ref: '/literal' } } } },
        },
        components: {
          responses: { 'x-response': { $ref: '#/missing-response' } },
          pathItems: { 'x-path': { $ref: '#/missing-path' } },
        },
      },
      { plugins: [loader.plugin], traversal: 'document', treeShake: false },
    )
    expect(loader.calls).toStrictEqual([])
    expect(result.diagnostics.map(({ reference }) => reference)).toStrictEqual(['#/missing-response', '#/missing-path'])
  })

  it('accumulates fragment schema identities across cached bundling runs', async () => {
    const external = { A: { $anchor: 'a', properties: { child: { $ref: '#b' } } }, B: { $anchor: 'b' } }
    const loader = sources({ '/ext.json': external })
    const cache = new Map<string, Promise<ResolveResult>>()
    for (const treeShake of [false, true]) {
      const resolvedDocuments: string[] = []
      const result = await bundleWithDiagnostics(
        {
          openapi: '3.1.0',
          components: {
            schemas: {
              A: { $ref: '/ext.json#/A' },
              ForwardAnchorB: { $ref: '/ext.json#b' },
              B: { $ref: '/ext.json#/B' },
              AnchorA: { $ref: '/ext.json#a' },
              AnchorB: { $ref: '/ext.json#b' },
            },
          },
        },
        {
          plugins: [loader.plugin],
          cache,
          traversal: 'document',
          treeShake,
          compress: () => 'external',
          hooks: {
            resolveDocument: (_document, uri) => {
              resolvedDocuments.push(uri)
              return undefined
            },
          },
        },
      )
      expect(resolvedDocuments.filter((uri) => uri === '/ext.json')).toStrictEqual(['/ext.json'])
      expect(result.diagnostics).toStrictEqual([])
      expect(result.document['components'].schemas.AnchorA.$ref).toBe('#/x-ext/external/A')
      expect(result.document['components'].schemas.AnchorB.$ref).toBe('#/x-ext/external/B')
      expect(result.document['components'].schemas.ForwardAnchorB.$ref).toBe('#/x-ext/external/B')
      expect(result.document['x-ext'].external).toStrictEqual({
        A: { $anchor: 'a', properties: { child: { $ref: '#b' } } },
        B: { $anchor: 'b' },
      })
    }
    expect(loader.calls).toStrictEqual(['/ext.json'])
  })

  it('retains missing global chunk fragments and skips pruning', async () => {
    const loader = sources({ '/ext.json': { present: {} } })
    const result = await bundleWithDiagnostics(
      { $ref: '/ext.json#/missing', $global: true },
      {
        plugins: [loader.plugin],
        treeShake: true,
        compress: () => 'external',
      },
    )
    expect(result.document['$ref']).toBe('/ext.json#/missing')
    expect(result.diagnostics).toMatchObject([{ kind: 'missing-target', reference: '/ext.json#/missing' }])
    expect(result.complete).toBe(false)
    expect(result.pruning).toBe('skipped')
    expect(result.document['x-ext'].external).toStrictEqual({ present: {} })
  })
})
