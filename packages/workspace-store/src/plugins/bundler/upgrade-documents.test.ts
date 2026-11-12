import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { type LoaderPlugin, bundle } from '@scalar/json-magic/bundle'
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

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
})
