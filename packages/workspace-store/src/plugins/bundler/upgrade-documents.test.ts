import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { type LoaderPlugin, bundle, bundleWithDiagnostics } from '@scalar/json-magic/bundle'
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it, vi } from 'vitest'

import { upgradeDocuments } from './upgrade-documents'

const loader = (documents: Record<string, unknown>): LoaderPlugin => ({
  type: 'loader',
  validate: (uri) => Object.hasOwn(documents, uri),
  exec: (uri) =>
    Promise.resolve({ ok: true, data: structuredClone(documents[uri]), raw: JSON.stringify(documents[uri]) }),
})

const read = (document: object, path: string[]): unknown => getValueAtPath(createMagicProxy(document), path)

describe('upgrade-documents', () => {
  it('upgrades a complete external 3.0 document referenced by a 3.1 document', async () => {
    const input = {
      openapi: '3.1.0',
      components: { schemas: { Item: { $ref: './item.json#/components/schemas/Item' } } },
    }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('3.1.0'),
        loader({
          'https://example.com/item.json': {
            openapi: '3.0.3',
            components: { schemas: { Item: { type: 'string', nullable: true } } },
          },
        }),
      ],
    })
    expect(read(input, ['components', 'schemas', 'Item', '$ref-value', 'type'])).toStrictEqual(['string', 'null'])
  })

  it('upgrades a bare schema in the original entry dialect', async () => {
    const input = { openapi: '3.0.3', components: { schemas: { Item: { $ref: './item.json' } } } }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('3.0.3'),
        loader({ 'https://example.com/item.json': { type: 'string', nullable: true } }),
      ],
    })
    expect(read(input, ['components', 'schemas', 'Item', '$ref-value', 'type'])).toStrictEqual(['string', 'null'])
  })

  it('preserves incoming 2.0 definition pointers and nested local references', async () => {
    const input = { openapi: '3.1.0', components: { schemas: { Pet: { $ref: './models.json#/definitions/Pet' } } } }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('3.1.0'),
        loader({
          'https://example.com/models.json': {
            swagger: '2.0',
            definitions: {
              Pet: { type: 'object', properties: { name: { $ref: '#/definitions/Name' } } },
              Name: { type: 'string', 'x-nullable': true },
            },
          },
        }),
      ],
    })
    expect(
      read(input, ['components', 'schemas', 'Pet', '$ref-value', 'properties', 'name', '$ref-value', 'type']),
    ).toStrictEqual(['string', 'null'])
  })

  it('upgrades a referenced 2.0 path item with a request body', async () => {
    const input = {
      swagger: '2.0',
      info: { title: 'Test', version: '1' },
      paths: { '/items': { $ref: './items.json#/paths/~1items' } },
    }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('2.0'),
        loader({
          'https://example.com/items.json': {
            swagger: '2.0',
            paths: {
              '/items': {
                post: {
                  parameters: [{ name: 'body', in: 'body', schema: { type: 'string' } }],
                  responses: { '200': { description: 'OK' } },
                },
              },
            },
          },
        }),
      ],
    })
    expect(
      read(input, [
        'paths',
        '/items',
        '$ref-value',
        'post',
        'requestBody',
        'content',
        'application/json',
        'schema',
        'type',
      ]),
    ).toBe('string')
  })
  it('keeps literal example references untouched', async () => {
    const example = { $ref: './literal.json', nullable: true, type: 'string' }
    const input = { openapi: '3.0.3', components: { schemas: { Item: { $ref: './item.json' } } } }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [upgradeDocuments('3.0.3'), loader({ 'https://example.com/item.json': { type: 'object', example } })],
    })
    expect(getRaw(read(input, ['components', 'schemas', 'Item', '$ref-value', 'examples']))).toStrictEqual([example])
  })

  it('upgrades nested bare references and terminates recursive schemas', async () => {
    const input = { openapi: '3.0.3', components: { schemas: { Item: { $ref: './item.json' } } } }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('3.0.3'),
        loader({
          'https://example.com/item.json': {
            type: 'object',
            properties: { name: { $ref: './name.json' }, next: { $ref: './item.json' } },
          },
          'https://example.com/name.json': { type: 'string', nullable: true },
        }),
      ],
    })
    expect(
      read(input, ['components', 'schemas', 'Item', '$ref-value', 'properties', 'name', '$ref-value', 'type']),
    ).toStrictEqual(['string', 'null'])
    expect(
      read(input, [
        'components',
        'schemas',
        'Item',
        '$ref-value',
        'properties',
        'next',
        '$ref-value',
        'properties',
        'name',
        '$ref-value',
        'type',
      ]),
    ).toStrictEqual(['string', 'null'])
  })

  it('uses an external owning document dialect rather than the entry dialect', async () => {
    const input = {
      openapi: '3.1.0',
      components: { schemas: { Item: { $ref: './legacy.json#/components/schemas/Item' } } },
    }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('3.1.0'),
        loader({
          'https://example.com/legacy.json': {
            openapi: '3.0.3',
            components: { schemas: { Item: { $ref: './item.json' } } },
          },
          'https://example.com/item.json': { type: 'string', nullable: true },
        }),
      ],
    })
    expect(read(input, ['components', 'schemas', 'Item', '$ref-value', '$ref-value', 'type'])).toStrictEqual([
      'string',
      'null',
    ])
  })

  it('preserves relocated descendant targets under a 2.0 response', async () => {
    const input = {
      openapi: '3.1.0',
      components: { schemas: { Name: { $ref: './legacy.json#/responses/Item/schema/properties/name' } } },
    }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments(),
        loader({
          'https://example.com/legacy.json': {
            swagger: '2.0',
            responses: {
              Item: { description: 'OK', schema: { type: 'object', properties: { name: { type: 'string' } } } },
            },
          },
        }),
      ],
    })
    expect(read(input, ['components', 'schemas', 'Name', '$ref-value', 'type'])).toBe('string')
  })

  it('converts an external body parameter using the operation media type', async () => {
    const input = {
      swagger: '2.0',
      paths: {
        '/items': {
          post: {
            consumes: ['text/plain'],
            parameters: [{ $ref: './body.json' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('2.0'),
        loader({
          'https://example.com/body.json': { name: 'body', in: 'body', schema: { $ref: './name.json' } },
          'https://example.com/name.json': { type: 'string' },
        }),
      ],
    })
    expect(read(input, ['paths', '/items', 'post', 'parameters'])).toBeUndefined()
    expect(
      read(input, ['paths', '/items', 'post', 'requestBody', 'content', 'text/plain', 'schema', '$ref-value', 'type']),
    ).toBe('string')
  })

  it('keeps shared bare fragments separate when referring source dialects differ', async () => {
    const input = {
      openapi: '3.1.0',
      components: {
        schemas: {
          Old: { $ref: './old.json#/definitions/Item' },
          New: { $ref: './new.json#/components/schemas/Item' },
        },
      },
    }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments(),
        loader({
          'https://example.com/old.json': { swagger: '2.0', definitions: { Item: { $ref: './item.json' } } },
          'https://example.com/new.json': {
            openapi: '3.0.3',
            components: { schemas: { Item: { $ref: './item.json' } } },
          },
          'https://example.com/item.json': { type: 'string', 'x-nullable': true },
        }),
      ],
    })
    expect(read(input, ['components', 'schemas', 'Old', '$ref-value', '$ref-value', 'type'])).toStrictEqual([
      'string',
      'null',
    ])
    expect(read(input, ['components', 'schemas', 'New', '$ref-value', '$ref-value', 'type'])).toBe('string')
  })
  it('does not inherit an old entry dialect through a declared modern document', async () => {
    const input = {
      openapi: '3.0.3',
      components: { schemas: { Item: { $ref: './modern.json#/components/schemas/Item' } } },
    }
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      plugins: [
        upgradeDocuments('3.0.3'),
        loader({
          'https://example.com/modern.json': {
            openapi: '3.1.0',
            components: { schemas: { Item: { $ref: './item.json' } } },
          },
          'https://example.com/item.json': { type: 'string', nullable: true },
        }),
      ],
    })
    expect(read(input, ['components', 'schemas', 'Item', '$ref-value', '$ref-value', 'type'])).toBe('string')
  })

  it('preserves the owning dialect after a partially bundled document is serialized', async () => {
    const input = {
      openapi: '3.1.0',
      components: { schemas: { Item: { $ref: './legacy.json#/components/schemas/Item' } } },
    }
    const resources = loader({
      'https://example.com/legacy.json': {
        openapi: '3.0.3',
        components: { schemas: { Item: { $ref: './item.json' } } },
      },
      'https://example.com/item.json': { type: 'string', nullable: true },
    })
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      urlMap: true,
      depth: 3,
      plugins: [upgradeDocuments('3.1.0'), resources],
    })
    const saved = JSON.parse(JSON.stringify(input))
    await bundle(saved, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      urlMap: true,
      plugins: [upgradeDocuments('3.1.0'), resources],
    })
    expect(read(saved, ['components', 'schemas', 'Item', '$ref-value', '$ref-value', 'type'])).toStrictEqual([
      'string',
      'null',
    ])
  })

  it('preserves effective response media types after serialization', async () => {
    const input = { openapi: '3.1.0', paths: { '/items': { $ref: './legacy.json#/paths/~1items' } } }
    const resources = loader({
      'https://example.com/legacy.json': {
        swagger: '2.0',
        produces: ['text/plain'],
        paths: {
          '/items': { get: { produces: ['application/xml'], responses: { '200': { $ref: './response.json' } } } },
        },
      },
      'https://example.com/response.json': { description: 'OK', schema: { type: 'string' } },
    })
    await bundle(input, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      urlMap: true,
      depth: 2,
      plugins: [upgradeDocuments(), resources],
    })
    const saved = JSON.parse(JSON.stringify(input))
    await bundle(saved, {
      traversal: 'document',
      origin: 'https://example.com/api.json',
      treeShake: false,
      urlMap: true,
      plugins: [upgradeDocuments(), resources],
    })
    expect(
      getRaw(read(saved, ['paths', '/items', '$ref-value', 'get', 'responses', '200', '$ref-value', 'content'])),
    ).toStrictEqual({ 'application/xml': { schema: { type: 'string' } } })
  })
  it('does not copy the full root while resolving an already upgraded document', async () => {
    const input = { openapi: '3.1.1', 'x-original-oas-version': '2.0', paths: {} }
    const clone = vi.spyOn(globalThis, 'structuredClone')
    try {
      await bundle(input, { traversal: 'document', treeShake: false, plugins: [upgradeDocuments('2.0')] })
      expect(clone.mock.calls.some(([value]) => value === input)).toBe(false)
    } finally {
      clone.mockRestore()
    }
  })

  it('preserves content-based parameters reached through cached global chunk references', async () => {
    const parameter = { name: 'filter', in: 'query', content: { 'application/json': { schema: { type: 'string' } } } }
    const input = {
      openapi: '3.1.1',
      'x-original-oas-version': '2.0',
      components: { parameters: { Filter: { $ref: '#/x-ext/chunk', $global: true } } },
      'x-ext': { chunk: parameter },
    }
    await bundle(input, { traversal: 'document', treeShake: false, plugins: [upgradeDocuments('2.0')] })
    expect(read(input, ['components', 'parameters', 'Filter', '$ref-value'])).toStrictEqual(parameter)
    expect(parameter).not.toHaveProperty('schema')
  })
  it.each(['/srv/specs/swagger.yaml', 'https://example.com/swagger.yaml'])(
    'keeps local body schema references local with origin %s',
    async (origin) => {
      const input = {
        swagger: '2.0',
        parameters: {
          Body: { in: 'body', name: 'body', schema: { $ref: '#/definitions/Pet' } },
          Limit: { in: 'query', name: 'limit', type: 'integer' },
        },
        definitions: { Pet: { type: 'string' } },
        paths: {
          '/pets': {
            post: {
              parameters: [{ $ref: '#/parameters/Body' }, { $ref: '#/parameters/Limit' }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }
      const externalLoads = vi.fn(() => Promise.resolve({ ok: false as const, error: 'Unexpected external load' }))
      await bundle(input, {
        origin,
        traversal: 'document',
        treeShake: false,
        plugins: [upgradeDocuments('2.0'), { type: 'loader', validate: () => true, exec: externalLoads }],
      })
      expect(
        read(input, [
          'paths',
          '/pets',
          'post',
          'requestBody',
          'content',
          'application/json',
          'schema',
          '$ref-value',
          'type',
        ]),
      ).toBe('string')
      expect(read(input, ['paths', '/pets', 'post', 'parameters', '0', '$ref-value', 'schema', 'type'])).toBe('integer')
      expect(externalLoads).not.toHaveBeenCalled()
    },
  )

  it.each(['missing', 'cyclic'] as const)('loads the rest of a document with %s parameter refs', async (kind) => {
    const input = {
      swagger: '2.0',
      parameters: {
        A: { $ref: '#/parameters/B' },
        B: { $ref: '#/parameters/A' },
      },
      paths: {
        '/pets': {
          get: {
            parameters: [{ $ref: kind === 'missing' ? './missing.yaml' : '#/parameters/A' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    await bundle(input, {
      origin: '/srv/specs/swagger.yaml',
      traversal: 'document',
      treeShake: false,
      plugins: [upgradeDocuments('2.0')],
    })
    expect(read(input, ['paths', '/pets', 'get', 'responses', '200', 'description'])).toBe('OK')
  })

  it.each(['body', 'formData'] as const)('relocates reusable external %s aliases', async (location) => {
    const parameter =
      location === 'body'
        ? { name: 'pet', in: location, schema: { type: 'string' } }
        : { name: 'pet', in: location, type: 'string' }
    const input = {
      swagger: '2.0',
      parameters: {
        Body: { $ref: './body.yaml' },
        Alias: { $ref: '#/parameters/Body' },
      },
      paths: { '/pets': { post: { parameters: [{ $ref: '#/parameters/Alias' }] } } },
    }
    await bundle(input, {
      origin: 'https://example.com/swagger.yaml',
      traversal: 'document',
      treeShake: false,
      plugins: [upgradeDocuments('2.0'), loader({ 'https://example.com/body.yaml': parameter })],
    })
    const media = location === 'body' ? 'application/json' : 'multipart/form-data'
    expect(read(input, ['components', 'requestBodies', 'Body', 'content', media, 'schema', 'type'])).toBe(
      location === 'body' ? 'string' : 'object',
    )
    expect(read(input, ['components', 'requestBodies', 'Alias', 'content', media, 'schema', 'type'])).toBe(
      location === 'body' ? 'string' : 'object',
    )
  })

  it('retains the layout of legacy resources in an existing bundle', async () => {
    const input = {
      openapi: '3.1.0',
      components: { schemas: { Pet: { $ref: '#/x-ext/old/definitions/Pet' } } },
      'x-ext': { old: { swagger: '2.0', definitions: { Pet: { type: 'file', 'x-nullable': true } } } },
      'x-ext-urls': { old: './old.yaml' },
    }
    await bundle(input, {
      origin: 'https://example.com/api.yaml',
      traversal: 'document',
      treeShake: false,
      plugins: [upgradeDocuments('3.1.0')],
    })
    expect(read(input, ['components', 'schemas', 'Pet', '$ref-value'])).toStrictEqual({
      type: 'file',
      'x-nullable': true,
    })
    expect(input['x-ext'].old.swagger).toBe('2.0')
  })

  it('ignores unsafe mapping keys and malformed saved media types', async () => {
    const input = {
      openapi: '3.1.1',
      'x-original-oas-version': '2.0',
      'x-scalar-upgrade': { from: '2.0', locations: [], contexts: [{ path: [], consumes: [3], produces: [3] }] },
      components: { responses: { OK: { $ref: './response.yaml' } } },
    }
    await bundle(input, {
      origin: 'https://example.com/api.yaml',
      traversal: 'document',
      treeShake: false,
      plugins: [
        upgradeDocuments('2.0'),
        loader({
          'https://example.com/response.yaml': {
            description: 'OK',
            schema: { type: 'string' },
            'x-scalar-upgrade': {
              mappings: Object.fromEntries([
                ['__proto__', JSON.stringify([[], '2.0', 'response', undefined, undefined])],
              ]),
              contexts: [{ path: [], consumes: [3], produces: [3] }],
            },
          },
        }),
      ],
    })
    expect(read(input, ['components', 'responses', 'OK', '$ref-value', 'content'])).toStrictEqual({
      'application/json': { schema: { type: 'string' } },
    })
  })

  it('rebases an aliased parameter with a recursive YAML object without overflowing', async () => {
    const body: Record<string, unknown> = { name: 'body', in: 'body', schema: { type: 'string' } }
    body.recursive = body
    const input = {
      swagger: '2.0',
      parameters: { Body: body },
      paths: {
        '/pets': { post: { parameters: [{ $ref: '#/parameters/Body' }] } },
      },
    }
    await bundle(input, {
      origin: '/srv/specs/swagger.yaml',
      traversal: 'document',
      treeShake: false,
      plugins: [upgradeDocuments('2.0')],
    })
    expect(
      read(input, ['paths', '/pets', 'post', 'requestBody', 'content', 'application/json', 'schema', 'type']),
    ).toBe('string')
  })
  it.each(['Body%', 'Body%20'])('decodes a parameter name containing a literal percent once: %s', async (name) => {
    const input = {
      swagger: '2.0',
      parameters: { [name]: { in: 'body', name: 'body', schema: { type: 'string' } } },
      paths: { '/pets': { post: { parameters: [{ $ref: `#/parameters/${encodeURIComponent(name)}` }] } } },
    }
    await bundle(input, {
      origin: '/srv/swagger.yaml',
      traversal: 'document',
      treeShake: false,
      plugins: [upgradeDocuments('2.0')],
    })
    expect(read(input, ['paths', '/pets', 'post', 'parameters'])).toBeUndefined()
    expect(
      read(input, ['paths', '/pets', 'post', 'requestBody', 'content', 'application/json', 'schema', 'type']),
    ).toBe('string')
  })

  it('ignores malformed media types on a saved contextual variant', async () => {
    const input = {
      openapi: '3.1.1',
      'x-original-oas-version': '2.0',
      paths: { '/pets': { post: { $ref: '#/x-ext/source/x-scalar-upgrade/variants/saved/value' } } },
      'x-ext-urls': { source: './source.yaml' },
      'x-ext': {
        source: {
          'x-scalar-upgrade': {
            variants: {
              saved: {
                from: '2.0',
                semanticPath: ['paths', '/pets', 'post'],
                consumes: [3],
                produces: [3],
                value: { responses: { '200': { $ref: './response.yaml' } } },
              },
            },
          },
        },
      },
    }
    await bundle(input, {
      origin: 'https://example.com/api.yaml',
      traversal: 'document',
      treeShake: false,
      plugins: [
        upgradeDocuments('2.0'),
        loader({ 'https://example.com/response.yaml': { description: 'OK', schema: { type: 'string' } } }),
      ],
    })
    expect(
      read(input, ['paths', '/pets', 'post', '$ref-value', 'responses', '200', '$ref-value', 'content']),
    ).toStrictEqual({
      'application/json': { schema: { type: 'string' } },
    })
  })

  it.each([
    { schema: { nullable: true, allOf: [{ type: 'string' }] }, pointer: 'allOf/0' },
    { schema: { nullable: true, $ref: '#/components/schemas/Base', allOf: [{ type: 'string' }] }, pointer: 'allOf/0' },
    { schema: { nullable: true, type: 'string', format: 'binary', allOf: [{ type: 'string' }] }, pointer: 'allOf/0' },
    {
      schema: { nullable: true, allOf: [{ nullable: true, allOf: [{ type: 'string' }] }] },
      pointer: 'allOf/0/allOf/0',
    },
  ])('resolves authored allOf pointers after conversion: %j', async ({ schema, pointer }) => {
    const input = {
      openapi: '3.0.3',
      components: {
        schemas: {
          Base: { type: 'string' },
          Pet: schema,
          Alias: { $ref: `#/components/schemas/Pet/${pointer}` },
        },
      },
    }
    await bundle(input, { traversal: 'document', treeShake: false, plugins: [upgradeDocuments('3.0.3')] })
    expect(read(input, ['components', 'schemas', 'Alias', '$ref-value', 'type'])).toBe('string')
  })
  it.each([false, true])('keeps parameter targets distinct from a form body (form first: %s)', async (formFirst) => {
    const query = { in: 'query', name: 'limit', type: 'integer' }
    const form = { in: 'formData', name: 'name', type: 'string' }
    const input = {
      swagger: '2.0',
      parameters: { Shared: { $ref: `#/paths/~1pets/post/parameters/${formFirst ? 1 : 0}` } },
      paths: {
        '/pets': {
          post: {
            parameters: formFirst ? [form, query] : [query, form],
          },
        },
      },
    }
    const result = await bundleWithDiagnostics(input, {
      traversal: 'document',
      treeShake: false,
      plugins: [upgradeDocuments('2.0')],
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.complete).toBe(true)
    expect(read(input, ['components', 'parameters', 'Shared', '$ref-value'])).toStrictEqual({
      in: 'query',
      name: 'limit',
      schema: { type: 'integer' },
    })
  })
})
