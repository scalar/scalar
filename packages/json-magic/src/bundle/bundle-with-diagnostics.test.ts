import { describe, expect, it } from 'vitest'

import { createMagicProxy } from '@/magic-proxy/proxy'

import { type LoaderPlugin, type ResolveResult, bundle } from './bundle'
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

  it.each([
    'schemas',
    'servers',
    'channels',
    'operations',
    'messages',
    'securitySchemes',
    'serverVariables',
    'parameters',
    'correlationIds',
    'replies',
    'replyAddresses',
    'externalDocs',
    'tags',
    'operationTraits',
    'messageTraits',
    'serverBindings',
    'channelBindings',
    'operationBindings',
    'messageBindings',
  ])('resolves AsyncAPI component names that resemble data keywords in %s', async (section) => {
    const entries = Object.fromEntries(
      ['default', 'examples', 'enum', 'const', 'value', 'x-entry'].map((name) => [
        name,
        { $ref: 'https://example.test/entry.json' },
      ]),
    )
    const literal = { $ref: 'https://example.test/literal.json', name: 'kept' }
    const loader = sources({ 'https://example.test/entry.json': { description: 'Entry', 'x-data': literal } })
    const result = await bundleWithDiagnostics(
      { asyncapi: '3.1.0', components: { [section]: entries } },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: () => 'entry' },
    )
    expect(result.complete).toBe(true)
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/entry.json'])
    for (const entry of Object.values(entries)) expect(entry).toStrictEqual({ $ref: '#/x-ext/entry' })
    expect(result.document['x-ext'].entry['x-data']).toStrictEqual(literal)
  })

  it.each([
    ['operationBindings', 'http', 'query'],
    ['messageBindings', 'http', 'headers'],
    ['channelBindings', 'ws', 'query'],
    ['channelBindings', 'ws', 'headers'],
    ['messageBindings', 'anypointmq', 'headers'],
    ['messageBindings', 'jms', 'headers'],
    ['operationBindings', 'kafka', 'groupId'],
    ['operationBindings', 'kafka', 'clientId'],
    ['messageBindings', 'kafka', 'key'],
    ['serverBindings', 'mqtt', 'sessionExpiryInterval'],
    ['serverBindings', 'mqtt', 'maximumPacketSize'],
    ['operationBindings', 'mqtt', 'messageExpiryInterval'],
    ['messageBindings', 'mqtt', 'correlationData'],
    ['messageBindings', 'mqtt', 'responseTopic'],
    ['serverBindings', 'mqtt5', 'sessionExpiryInterval'],
    ['operationBindings', 'solace', 'timeToLive'],
    ['operationBindings', 'solace', 'priority'],
  ])('resolves schema references in %s.%s.%s', async (section, protocol, field) => {
    const literal = { $ref: 'https://example.test/literal.json', name: 'kept' }
    const schema = {
      type: 'object',
      properties: {
        default: { $ref: 'https://example.test/id.json' },
        'x-id': { $ref: 'https://example.test/id.json' },
      },
      default: structuredClone(literal),
      examples: [structuredClone(literal)],
    }
    const loader = sources({ 'https://example.test/id.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        info: { title: 'Bindings', version: '1' },
        components: { [section]: { Shared: { [protocol]: { [field]: schema } } } },
      },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: () => 'id' },
    )
    expect(result.complete).toBe(true)
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/id.json'])
    expect(schema.properties).toStrictEqual({
      default: { $ref: '#/x-ext/id' },
      'x-id': { $ref: '#/x-ext/id' },
    })
    expect(schema.default).toStrictEqual(literal)
    expect(schema.examples).toStrictEqual([literal])
  })

  it.each(['3.1.0', '3.2.0'])(
    'preserves custom schemaFormat and schema fields in OpenAPI %s schemas',
    async (openapi) => {
      const customSchema = {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: { $ref: './literal.json' },
        properties: { value: { $ref: './value.json' } },
      }
      const input = { openapi, components: { schemas: { Custom: customSchema } } }
      const loader = sources({ '/value.json': { type: 'string' } })
      const result = await bundleWithDiagnostics(input, {
        origin: '/root.json',
        plugins: [loader.plugin],
        treeShake: false,
        traversal: 'document',
        compress: (uri) => (uri.includes('literal') ? 'literal' : 'value'),
      })
      expect(result.diagnostics).toStrictEqual([])
      expect(loader.calls).toStrictEqual(['/value.json'])
      expect(customSchema).toStrictEqual({
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: { $ref: './literal.json' },
        properties: { value: { $ref: '#/x-ext/value' } },
      })
    },
  )

  it.each(['3.0.0', '3.1.0'])('resolves external Multi Format Schema wrappers in AsyncAPI %s', async (asyncapi) => {
    const input = { asyncapi, components: { schemas: { Event: { $ref: './wrapper.json' } } } }
    const loader = sources({
      '/wrapper.json': {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: { $ref: './value.json' },
      },
      '/value.json': { type: 'string' },
    })
    const result = await bundleWithDiagnostics(input, {
      origin: '/root.json',
      plugins: [loader.plugin],
      treeShake: false,
      traversal: 'document',
      compress: (uri) => (uri.includes('wrapper') ? 'wrapper' : 'value'),
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['/wrapper.json', '/value.json'])
    expect(result.document['x-ext']).toStrictEqual({
      wrapper: {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: { $ref: '#/x-ext/value' },
      },
      value: { type: 'string' },
    })
  })

  it.each([false, true])('preserves the target wrapper vocabulary (wrapper first: %s)', async (wrapperFirst) => {
    const wrapper = {
      schemaFormat: 'application/schema+json;version=draft-07',
      schema: { $ref: 'https://example.test/value.json' },
    }
    const native = { properties: { value: { $ref: '#/components/schemas/Wrapped' } } }
    const loader = sources({ 'https://example.test/value.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: wrapperFirst ? { Wrapped: wrapper, Native: native } : { Native: native, Wrapped: wrapper },
        },
      },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: () => 'value' },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/value.json'])
    expect(wrapper.schema).toStrictEqual({ $ref: '#/x-ext/value' })
  })

  it('ignores AsyncAPI 2.x parameter schema reference siblings', async () => {
    const ignored = { properties: { sibling: { $ref: 'https://example.test/ignored.json' } } }
    const parameter = { schema: { $ref: 'https://example.test/value.json', ...ignored } }
    const loader = sources({ 'https://example.test/value.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(
      { asyncapi: '2.6.0', channels: { 'events/{id}': { parameters: { id: parameter } } } },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: (uri) => uri.split('/').at(-1)! },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/value.json'])
    expect(parameter.schema).toStrictEqual({ $ref: '#/x-ext/value.json', ...ignored })
  })

  it.each([
    'application/schema+json;version=draft-04',
    'application/schema+yaml;version=draft-06',
    'application/vnd.oai.openapi;version=3.0.0',
    'application/vnd.oai.openapi+json;version=3.0.4',
    'application/vnd.oai.openapi+yaml;version=3.0.0',
  ])('ignores reference siblings in %s wrappers and their subschemas', async (schemaFormat) => {
    const ignored = { properties: { sibling: { $ref: 'https://example.test/ignored.json' } } }
    const reference = { $ref: 'https://example.test/value.json', ...ignored }
    const wrapper = { schemaFormat, schema: structuredClone(reference) }
    const nested = { schemaFormat, schema: { properties: { value: structuredClone(reference) } } }
    const loader = sources({
      'https://example.test/value.json': { $ref: './actual.json', ...ignored },
      'https://example.test/actual.json': { type: 'string' },
    })
    const result = await bundleWithDiagnostics(
      { asyncapi: '3.1.0', components: { schemas: { Wrapped: wrapper, Nested: nested } } },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: (uri) => uri.split('/').at(-1)! },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/value.json', 'https://example.test/actual.json'])
    expect(wrapper.schema).toStrictEqual({ $ref: '#/x-ext/value.json', ...ignored })
    expect(nested.schema.properties.value).toStrictEqual({ $ref: '#/x-ext/value.json', ...ignored })
    expect(result.document['x-ext']['value.json']).toStrictEqual({ $ref: '#/x-ext/actual.json', ...ignored })
  })

  it.each(['own', 'nested'])('does not register %s identities in ignored reference siblings', async (kind) => {
    const uri = 'https://example.test/ignored.json'
    const ignored = kind === 'own' ? { $id: uri } : { definitions: { Hidden: { $id: uri, type: 'string' } } }
    const wrapper = {
      schemaFormat: 'application/schema+json;version=draft-07',
      schema: { $ref: '#/components/schemas/Base', ...ignored },
    }
    const other = { schemaFormat: wrapper.schemaFormat, schema: { $ref: uri } }
    const loader = sources({ [uri]: { type: 'boolean' } })
    const result = await bundleWithDiagnostics(
      { asyncapi: '3.1.0', components: { schemas: { Base: { type: 'number' }, Wrapped: wrapper, Other: other } } },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: () => 'ignored' },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual([uri])
    expect(wrapper.schema).toStrictEqual({ $ref: '#/components/schemas/Base', ...ignored })
    expect(other.schema).toStrictEqual({ $ref: '#/x-ext/ignored' })
    expect(result.document['x-ext']).toStrictEqual({ ignored: { type: 'boolean' } })
  })

  it('removes ignored cached identities after inheriting a wrapper dialect', async () => {
    const cached = { $ref: 'https://example.test/actual.json', $id: 'https://example.test/ignored.json' }
    const schemaFormat = 'application/schema+json;version=draft-07'
    const loader = sources({
      'https://example.test/actual.json': { type: 'number' },
      'https://example.test/ignored.json': { type: 'boolean' },
    })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Wrapped: { schemaFormat, schema: { $ref: 'https://example.test/cached.json' } },
            Other: { schemaFormat, schema: { $ref: 'https://example.test/ignored.json' } },
          },
        },
      },
      {
        traversal: 'document',
        treeShake: false,
        plugins: [loader.plugin],
        cache: new Map([
          [
            'https://example.test/cached.json',
            Promise.resolve({ ok: true, data: cached, raw: JSON.stringify(cached) }),
          ],
        ]),
        compress: (uri) => uri.split('/').at(-1)!,
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/actual.json', 'https://example.test/ignored.json'])
    expect(result.document['components'].schemas.Other.schema).toStrictEqual({ $ref: '#/x-ext/ignored.json' })
    expect(result.document['x-ext']['ignored.json']).toStrictEqual({ type: 'boolean' })
  })

  it('does not register anchors in ignored reference siblings', async () => {
    const wrapper = {
      schemaFormat: 'application/schema+json;version=draft-07',
      schema: { $ref: '#/components/schemas/Base', $anchor: 'ignored' },
    }
    const loader = sources({})
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Base: { type: 'number' },
            Wrapped: wrapper,
            Other: { schemaFormat: wrapper.schemaFormat, schema: { $ref: '#ignored' } },
          },
        },
      },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin] },
    )
    expect(result.diagnostics).toStrictEqual([
      { kind: 'missing-target', reference: '#ignored', source: '/', pointer: '#/components/schemas/Other/schema/$ref' },
    ])
    expect(loader.calls).toStrictEqual([])
    expect(wrapper.schema).toStrictEqual({ $ref: '#/components/schemas/Base', $anchor: 'ignored' })
  })

  it.each(['04', '06', '07'])('preserves unknown keywords in inline and external draft-%s schemas', async (draft) => {
    const literal = { $ref: 'https://example.test/literal.json', note: 'keep' }
    const annotations = {
      $defs: { Named: structuredClone(literal) },
      dependentSchemas: { value: structuredClone(literal) },
      prefixItems: [structuredClone(literal)],
      contentSchema: structuredClone(literal),
      unevaluatedProperties: structuredClone(literal),
      unevaluatedItems: structuredClone(literal),
      ...(draft === '04' ? { contains: structuredClone(literal), propertyNames: structuredClone(literal) } : {}),
      ...(draft !== '07'
        ? { if: structuredClone(literal), then: structuredClone(literal), else: structuredClone(literal) }
        : {}),
    }
    const schema = {
      type: 'object',
      properties: { value: { $ref: 'https://example.test/value.json' } },
      ...annotations,
    }
    const schemaFormat = `application/schema+json;version=draft-${draft}`
    const loader = sources({
      'https://example.test/value.json': { type: 'string' },
      'https://example.test/external.json': structuredClone(schema),
    })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Inline: { schemaFormat, schema },
            External: { schemaFormat, schema: { $ref: 'https://example.test/external.json' } },
          },
        },
      },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: (uri) => uri.split('/').at(-1)! },
    )
    const expected = { type: 'object', properties: { value: { $ref: '#/x-ext/value.json' } }, ...annotations }
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/value.json', 'https://example.test/external.json'])
    expect(schema).toStrictEqual(expected)
    expect(result.document['x-ext']['external.json']).toStrictEqual(expected)
  })

  it.each([
    { draft: '04', keyword: 'contains', resolves: false },
    { draft: '06', keyword: 'contains', resolves: true },
    { draft: '07', keyword: 'contains', resolves: true },
    { draft: '04', keyword: 'if', resolves: false },
    { draft: '06', keyword: 'if', resolves: false },
    { draft: '07', keyword: 'if', resolves: true },
  ])('uses the draft-$draft vocabulary for $keyword', async ({ draft, keyword, resolves }) => {
    const child = { $ref: 'https://example.test/value.json' }
    const loader = sources({ 'https://example.test/value.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Wrapped: { schemaFormat: `application/schema+json;version=draft-${draft}`, schema: { [keyword]: child } },
          },
        },
      },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: () => 'value' },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(resolves ? ['https://example.test/value.json'] : [])
    expect(child).toStrictEqual({ $ref: resolves ? '#/x-ext/value' : 'https://example.test/value.json' })
  })

  it.each([
    { draft: '04', idKeyword: 'id' },
    { draft: '06', idKeyword: '$id' },
    { draft: '07', idKeyword: '$id' },
  ] as const)('uses $idKeyword as the draft-$draft identifier', async ({ draft, idKeyword }) => {
    const schema = {
      id: 'https://ignored.test/',
      $id: 'https://ignored.test/',
      [idKeyword]: 'https://example.test/nested/base.json',
      properties: { value: { $ref: 'value.json' } },
    }
    const loader = sources({ 'https://example.test/nested/value.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: { Wrapped: { schemaFormat: `application/schema+json;version=draft-${draft}`, schema } },
        },
      },
      {
        origin: 'https://example.test/root.json',
        traversal: 'document',
        treeShake: false,
        plugins: [loader.plugin],
        compress: () => 'value',
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/nested/value.json'])
    expect(schema.properties.value.$ref).toBe('#/x-ext/value')
  })

  it.each([
    'application/schema+json;version=draft-04',
    'application/schema+json;version=draft-06',
    'application/schema+json;version=draft-07',
    'application/vnd.oai.openapi+json;version=3.0.0',
    'application/vnd.aai.asyncapi+json;version=3.1.0',
  ])('does not register $anchor annotations in %s', async (schemaFormat) => {
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Target: { schemaFormat, schema: { type: 'string', $anchor: 'literal-anchor' } },
            Source: { schemaFormat, schema: { $ref: '#literal-anchor' } },
          },
        },
      },
      { traversal: 'document', treeShake: false, plugins: [] },
    )
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'missing-target',
        reference: '#literal-anchor',
        source: '/',
        pointer: '#/components/schemas/Source/schema/$ref',
      },
    ])
  })

  it('ignores OpenAPI 3.0 wrapper $id annotations when resolving relative references', async () => {
    const schema = { $id: 'https://ignored.test/', properties: { value: { $ref: 'value.json' } } }
    const loader = sources({ 'https://example.test/value.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: { schemas: { Wrapped: { schemaFormat: 'application/vnd.oai.openapi;version=3.0.0', schema } } },
      },
      {
        origin: 'https://example.test/root.json',
        traversal: 'document',
        treeShake: false,
        plugins: [loader.plugin],
        compress: () => 'value',
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/value.json'])
  })

  it('canonicalizes draft-04 id without promoting its $id annotation', async () => {
    const schema = { id: './nested/', $id: 'https://ignored.test/', properties: { value: { $ref: 'value.json' } } }
    const loader = sources({ 'https://example.test/nested/value.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: { schemas: { Wrapped: { schemaFormat: 'application/schema+json;version=draft-04', schema } } },
      },
      {
        origin: 'https://example.test/root.json',
        traversal: 'document',
        treeShake: false,
        plugins: [loader.plugin],
        compress: () => 'value',
        preserveReference: () => false,
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/nested/value.json'])
    expect(schema.id).toBe('https://example.test/nested/')
    expect(schema.$id).toBe('https://ignored.test/')
  })

  it('restores cached annotations after selecting a draft-04 vocabulary', async () => {
    const cached = { $id: './literal/', type: 'string' }
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Wrapped: {
              schemaFormat: 'application/schema+json;version=draft-04',
              schema: { $ref: 'https://example.test/cached.json' },
            },
          },
        },
      },
      {
        origin: 'https://example.test/root.json',
        traversal: 'document',
        treeShake: false,
        preserveReference: () => false,
        cache: new Map([
          [
            'https://example.test/cached.json',
            Promise.resolve({ ok: true, data: cached, raw: JSON.stringify(cached) }),
          ],
        ]),
        plugins: [],
        compress: () => 'cached',
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.document['x-ext']).toStrictEqual({ cached: { $id: './literal/', type: 'string' } })
    expect(cached).toStrictEqual({ $id: './literal/', type: 'string' })
  })

  it.each([false, true])('indexes authored identity paths with proxied input: %s', async (proxied) => {
    const input = {
      asyncapi: '3.1.0',
      components: {
        messages: { M: { payload: { $ref: '#/components/schemas/S' } } },
        schemas: {
          S: { $id: './schema.json', properties: { id: { $ref: './id.json' } } },
          Other: { $ref: 'https://example.test/schema.json' },
        },
      },
    }
    const loader = sources({ 'https://example.test/id.json': { type: 'string' } })
    const result = await bundleWithDiagnostics(proxied ? createMagicProxy(input) : input, {
      traversal: 'document',
      treeShake: false,
      origin: 'https://example.test/root.json',
      plugins: [loader.plugin],
      compress: () => 'id',
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/id.json'])
    expect(input.components.schemas.Other.$ref).toBe('#/components/schemas/S')
    expect(JSON.parse(JSON.stringify(input)).components.schemas.Other).toStrictEqual({
      $ref: '#/components/schemas/S',
    })
  })

  it('resolves draft-04 fragment identifiers declared with id', async () => {
    const schemaFormat = 'application/schema+json;version=draft-04'
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Target: { schemaFormat, schema: { id: '#named', type: 'string' } },
            Source: { schemaFormat, schema: { $ref: '#named' } },
          },
        },
      },
      { traversal: 'document', treeShake: false, plugins: [] },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.complete).toBe(true)
  })

  it('drops cached legacy anchors while keeping valid identifiers', async () => {
    const cached = { $id: 'https://example.test/cached.json', $anchor: 'ignored', type: 'string' }
    const schemaFormat = 'application/schema+json;version=draft-07'
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Wrapped: { schemaFormat, schema: { $ref: 'https://example.test/cached.json' } },
            Other: { schemaFormat, schema: { $ref: 'https://example.test/cached.json#ignored' } },
          },
        },
      },
      {
        traversal: 'document',
        treeShake: false,
        plugins: [],
        cache: new Map([
          [
            'https://example.test/cached.json',
            Promise.resolve({ ok: true, data: cached, raw: JSON.stringify(cached) }),
          ],
        ]),
        compress: () => 'cached',
      },
    )
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'missing-target',
        reference: 'https://example.test/cached.json#ignored',
        source: '/',
        pointer: '#/components/schemas/Other/schema/$ref',
      },
    ])
    expect(cached).toStrictEqual({ $id: 'https://example.test/cached.json', $anchor: 'ignored', type: 'string' })
  })

  it('resolves supported siblings in a newer JSON Schema wrapper', async () => {
    const wrapper = {
      schemaFormat: 'application/schema+json;version=draft-2020-12',
      schema: {
        $ref: 'https://example.test/base.json',
        properties: { extra: { $ref: 'https://example.test/extra.json' } },
      },
    }
    const loader = sources({
      'https://example.test/base.json': { type: 'object' },
      'https://example.test/extra.json': { type: 'string' },
    })
    const result = await bundleWithDiagnostics(
      { asyncapi: '3.1.0', components: { schemas: { Wrapped: wrapper } } },
      { traversal: 'document', treeShake: false, plugins: [loader.plugin], compress: (uri) => uri.split('/').at(-1)! },
    )
    expect(result.complete).toBe(true)
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual(['https://example.test/extra.json', 'https://example.test/base.json'])
    expect(wrapper.schema).toStrictEqual({
      $ref: '#/x-ext/base.json',
      properties: { extra: { $ref: '#/x-ext/extra.json' } },
    })
  })

  it.each(['3.1.0', '3.2.0', 'standalone'])(
    'preserves schemaFormat and schema annotations in %s schemas',
    async (version) => {
      const schema = {
        type: 'object',
        schemaFormat: 'annotation',
        schema: { $ref: 'https://example.test/literal.json', name: 'kept' },
        externalDocs: { $ref: 'https://example.test/docs.json' },
        additionalItems: { $ref: 'https://example.test/item.json' },
      }
      const original = structuredClone(schema)
      const input =
        version === 'standalone'
          ? schema
          : {
              openapi: version,
              info: { title: 'Annotations', version: '1' },
              components: { schemas: { Metadata: schema } },
            }
      const loader = sources({})
      const result = await bundleWithDiagnostics(input, {
        traversal: 'document',
        treeShake: false,
        plugins: [loader.plugin],
      })
      expect(result.complete).toBe(true)
      expect(result.diagnostics).toStrictEqual([])
      expect(loader.calls).toStrictEqual([])
      expect(schema).toStrictEqual(original)
    },
  )

  it.each(['3.0.0', '3.1.0'])(
    'resolves external AsyncAPI %s wrappers while preserving nested schema annotations',
    async (asyncapi) => {
      const annotation = {
        schemaFormat: 'annotation',
        schema: { $ref: 'https://example.test/literal.json', name: 'kept' },
      }
      const wrapper = {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: { type: 'object', properties: { metadata: annotation, id: { $ref: './id.json' } } },
      }
      const loader = sources({
        '/message.json': { payload: { $ref: './wrapper.json' }, headers: { $ref: './wrapper.json' } },
        '/wrapper.json': wrapper,
        '/id.json': { type: 'string' },
      })
      const result = await bundleWithDiagnostics(
        {
          asyncapi,
          info: { title: 'Events', version: '1' },
          components: {
            messages: { Event: { $ref: './message.json' } },
            schemas: { Event: { $ref: './wrapper.json' } },
          },
        },
        {
          origin: '/root.json',
          traversal: 'document',
          treeShake: false,
          plugins: [loader.plugin],
          compress: (uri) => uri.split('/').at(-1)!,
        },
      )
      expect(result.complete).toBe(true)
      expect(result.diagnostics).toStrictEqual([])
      expect(loader.calls).toStrictEqual(['/message.json', '/wrapper.json', '/id.json'])
      expect(result.document['x-ext']['wrapper.json']).toStrictEqual({
        schemaFormat: wrapper.schemaFormat,
        schema: { type: 'object', properties: { metadata: annotation, id: { $ref: '#/x-ext/id.json' } } },
      })
    },
  )

  it.each(['default', 'example', 'enum', 'const', 'x-name'])(
    'resolves itemSchema properties named %s while preserving literal defaults',
    async (name) => {
      const literal = { $ref: '/literal.json' }
      const itemSchema = { properties: { [name]: { $ref: './value.json' } }, default: literal }
      const input = {
        openapi: '3.2.0',
        paths: {
          '/events': {
            get: { responses: { '200': { description: 'Events', content: { 'application/jsonl': { itemSchema } } } } },
          },
        },
      }
      const loader = sources({ '/value.json': { type: 'string' } })
      const result = await bundleWithDiagnostics(input, {
        origin: '/root.json',
        plugins: [loader.plugin],
        treeShake: false,
        traversal: 'document',
        compress: () => 'value',
      })
      expect(result.diagnostics).toStrictEqual([])
      expect(loader.calls).toStrictEqual(['/value.json'])
      expect(itemSchema).toStrictEqual({
        properties: { [name]: { $ref: '#/x-ext/value' } },
        default: literal,
      })
    },
  )

  it('indexes itemSchema identifiers and anchors without fetching their canonical URLs', async () => {
    const itemSchema = { $id: './stream.json', $anchor: 'event', type: 'object' }
    const input = {
      openapi: '3.2.0',
      paths: {
        '/events': {
          get: { responses: { '200': { description: 'Events', content: { 'application/jsonl': { itemSchema } } } } },
        },
      },
      components: { schemas: { Event: { $ref: './stream.json#event' } } },
    }
    const loader = sources({})
    const result = await bundleWithDiagnostics(input, {
      origin: '/root.json',
      plugins: [loader.plugin],
      treeShake: false,
      traversal: 'document',
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(loader.calls).toStrictEqual([])
    expect(result.complete).toBe(true)
    expect(input.components.schemas.Event.$ref).toBe('./stream.json#event')
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
  it('reports loader exceptions and rejected cache entries as external loading failures', async () => {
    const plugin: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: () => {
        throw new TypeError('loader bug')
      },
    }
    const result = await bundleWithDiagnostics(
      { loaded: { $ref: '/throws' }, cached: { $ref: '/cached' } },
      { plugins: [plugin], treeShake: true, cache: new Map([['/cached', Promise.reject(new Error('cache failed'))]]) },
    )
    expect(result.diagnostics).toStrictEqual([
      { kind: 'unresolved-document', reference: '/throws', source: '/', pointer: '#/loaded/$ref' },
      { kind: 'unresolved-document', reference: '/cached', source: '/', pointer: '#/cached/$ref' },
    ])
    expect(result.pruning).toBe('skipped')
    await expect(bundleWithDiagnostics('/throws', { plugins: [plugin], treeShake: false })).rejects.toThrow(
      'Failed to resolve input',
    )
  })

  it.each([true, false])(
    'uses the same URI fragment rules with and without diagnostics (treeShake: %s)',
    async (treeShake) => {
      const external = {
        'Foo Bar': { type: 'string' },
        '%20#': { type: 'number' },
        'a/b~c': { type: 'boolean' },
        $defs: { Item: { type: 'object' } },
      }
      const input = {
        space: { $ref: '/external.json#/Foo%20Bar' },
        percent: { $ref: '/external.json#/%2520%23' },
        escaped: { $ref: '/external.json#/a~1b~0c' },
        definition: { $ref: '/external.json#/$defs/Item' },
      }
      const config = {
        plugins: [sources({ '/external.json': external }).plugin],
        treeShake,
        compress: () => 'external',
      }
      const plain = await bundle(structuredClone(input), config)
      const diagnosed = await bundleWithDiagnostics(structuredClone(input), config)
      expect(diagnosed.diagnostics).toStrictEqual([])
      expect(plain).toStrictEqual(diagnosed.document)
      expect(plain['x-ext'].external).toStrictEqual(external)
      expect(plain['percent'].$ref).toBe('#/x-ext/external/%2520%23')
      expect(plain['definition'].$ref).toBe('#/x-ext/external/$defs/Item')
    },
  )

  it('exposes scoped targets to lifecycle hooks without visiting literal examples', async () => {
    const targets: unknown[] = []
    const document = {
      openapi: '3.1.0',
      info: { title: 'Scopes', version: '1' },
      paths: {},
      components: {
        schemas: {
          Root: { type: 'number' },
          Scoped: {
            $id: 'https://example.com/scoped',
            $defs: { value: { type: 'string' } },
            properties: {
              local: { $ref: '#/$defs/value' },
              external: { $ref: '#/x-ext/model' },
            },
            example: { $ref: '#/missing' },
          },
          Reference: { $ref: '#/components/schemas/Root' },
        },
      },
      'x-ext': { model: { type: 'boolean' } },
    }
    const result = await bundleWithDiagnostics(document, {
      plugins: [],
      traversal: 'document',
      treeShake: false,
      hooks: {
        onAfterNodeProcess: (node, context) => {
          if (typeof node.$ref === 'string') {
            targets.push(context.resolveReference(node.$ref))
          }
        },
      },
    })
    expect(result.complete).toBe(true)
    expect(targets).toStrictEqual([
      {
        path: ['components', 'schemas', 'Scoped', '$defs', 'value'],
        value: { type: 'string' },
        resourceRelative: true,
      },
      { path: ['x-ext', 'model'], value: { type: 'boolean' }, resourceRelative: false },
      { path: ['components', 'schemas', 'Root'], value: { type: 'number' }, resourceRelative: false },
    ])
  })

  it('reports the root target of a back-reference inside a previously bundled document', async () => {
    const targets: unknown[] = []
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        info: { title: 'Back references', version: '1' },
        paths: {},
        components: { schemas: { Owner: { type: 'string' }, Pet: { $ref: '#/x-ext/pet' } } },
        'x-ext': { pet: { properties: { owner: { $ref: '#/components/schemas/Owner' } } } },
      },
      {
        plugins: [],
        traversal: 'document',
        treeShake: false,
        hooks: {
          onAfterNodeProcess: (node, context) => {
            if (node.$ref === '#/components/schemas/Owner') {
              targets.push(context.resolveReference(node.$ref))
            }
          },
        },
      },
    )
    expect(result.complete).toBe(true)
    expect(targets).toEqual([
      { path: ['components', 'schemas', 'Owner'], value: { type: 'string' }, resourceRelative: false },
    ])
  })

  it('keeps prebundled relative identifiers independent when checking missing targets', async () => {
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        info: { title: 'Scopes', version: '1' },
        paths: {},
        components: { schemas: { A: { $ref: '#/x-ext/a' }, B: { $ref: '#/x-ext/b' } } },
        'x-ext': {
          a: { $id: 'Pet.yaml', properties: { value: { $ref: '#/$defs/Value' } } },
          b: { $id: 'Pet.yaml', $defs: { Value: { type: 'string' } } },
        },
      },
      { plugins: [], traversal: 'document', treeShake: false },
    )
    expect(result.complete).toBe(false)
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'missing-target',
        reference: '#/$defs/Value',
        source: '#/x-ext/a',
        pointer: '#/properties/value/$ref',
      },
    ])
  })

  it('visits retained unreferenced bundled entries with lifecycle hooks', async () => {
    const visited: string[] = []
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        info: { title: 'Retained', version: '1' },
        paths: {},
        'x-ext': { a: { properties: { self: { $ref: '#/x-ext/a' } }, example: { $ref: '#/literal' } } },
      },
      {
        plugins: [],
        traversal: 'document',
        treeShake: false,
        hooks: {
          onAfterNodeProcess: (node): void => {
            if (typeof node.$ref === 'string') {
              visited.push(node.$ref)
            }
          },
        },
      },
    )
    expect(result.complete).toBe(true)
    expect(visited).toStrictEqual(['#/x-ext/a'])
  })
})
