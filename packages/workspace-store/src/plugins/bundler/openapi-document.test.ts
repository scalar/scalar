import { type LoaderPlugin, bundle } from '@scalar/json-magic/bundle'
import { getHash } from '@scalar/json-magic/bundle/value-generator'
import { getSegmentsFromPath } from '@scalar/json-magic/helpers/get-segments-from-path'
import { getValueByPath } from '@scalar/json-magic/helpers/get-value-by-path'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { openApiDocument, resolveOpenApiDocument } from './openapi-document'

describe('openapi-document', () => {
  it.each([
    ['https://example.com/api.json#here', 'https://example.com/api.json'],
    ['./api.json?version=2#here', 'https://example.com/api.json?version=2'],
    ['#here', 'https://example.com/input.json'],
    ['https://example.com/api%23name.json#here', 'https://example.com/api%23name.json'],
    ['urn:example:orders#here', 'urn:example:orders'],
  ])('removes the fragment from the base of %s', (self, baseUri) => {
    expect(resolveOpenApiDocument({ openapi: '3.2.1', $self: self }, 'https://example.com/input.json')).toStrictEqual({
      baseUri,
      metadata: { openapi: '3.2.1', $self: `${baseUri}#here` },
    })
  })

  it.each([false, true])('resolves a fragment-bearing document identity with treeShake %s', async (treeShake) => {
    const input = {
      openapi: '3.2.1',
      $self: 'https://example.com/api.json#here',
      components: {
        schemas: {
          Value: { type: 'string' },
          Ref: { $ref: 'api.json#/components/schemas/Value' },
          Model: { $id: 'model.json', properties: { value: { $ref: 'api.json#/components/schemas/Value' } } },
        },
      },
    }
    const requested: string[] = []
    const errors: unknown[] = []
    await bundle(input, {
      treeShake,
      plugins: [
        openApiDocument(),
        {
          type: 'loader',
          validate: () => true,
          exec: (uri) => {
            requested.push(uri)
            return Promise.resolve({ ok: false })
          },
        },
      ],
      hooks: {
        onResolveError: (node) => {
          errors.push(node.$ref)
        },
      },
    })
    expect(requested).toStrictEqual([])
    expect(errors).toStrictEqual([])
    expect(input.components.schemas.Ref.$ref).toBe('#/components/schemas/Value')
    expect(input.components.schemas.Model.properties.value.$ref).toBe(
      'https://example.com/api.json#/components/schemas/Value',
    )
    expect(
      createMagicProxy(input, {
        documentUri: resolveOpenApiDocument(input, '/')?.baseUri,
      }).components.schemas.Model.properties.value,
    ).toStrictEqual({
      $ref: 'https://example.com/api.json#/components/schemas/Value',
      '$ref-value': { type: 'string' },
    })
    expect(input.$self).toBe('https://example.com/api.json#here')
  })

  it.each([false, true])(
    'qualifies cross-resource pointers from a schema base with external target %s',
    async (external) => {
      const input = {
        openapi: '3.2.1',
        $self: './openapi.yaml',
        components: {
          schemas: {
            Value: { type: 'string' },
            Model: {
              $id: 'models/model.json',
              properties: { value: { $ref: external ? 'value.yaml' : '../openapi.yaml#/components/schemas/Value' } },
            },
          },
        },
      }
      await bundle(input, {
        origin: 'https://example.com/input.yaml',
        treeShake: true,
        plugins: [
          openApiDocument(),
          {
            type: 'loader',
            validate: () => true,
            exec: () => Promise.resolve({ ok: true, data: { type: 'string' }, raw: '{"type":"string"}' }),
          },
        ],
      })
      const pointer = external ? `#/x-ext/${getHash('models/value.yaml')}` : '#/components/schemas/Value'
      expect(input.$self).toBe('https://example.com/openapi.yaml')
      expect(input.components.schemas.Model.properties.value.$ref).toBe(`https://example.com/openapi.yaml${pointer}`)
      expect(
        createMagicProxy(input, { documentUri: input.$self }).components.schemas.Model.properties.value,
      ).toStrictEqual({
        $ref: `https://example.com/openapi.yaml${pointer}`,
        '$ref-value': { type: 'string' },
      })
    },
  )

  it.each(['models/model.json', 'https://example.com/models/model.json'])(
    'preserves schema-local pointers under $id %s',
    async (id) => {
      const input = {
        openapi: '3.2.1',
        $self: 'https://example.com/openapi.yaml',
        components: {
          schemas: {
            Model: {
              $id: id,
              $defs: { Value: { type: 'string' } },
              properties: { value: { $ref: '#/$defs/Value' } },
            },
          },
        },
      }
      await bundle(input, { plugins: [openApiDocument()], treeShake: false })
      expect(input.components.schemas.Model.properties.value.$ref).toBe('#/$defs/Value')
      expect(input.components.schemas.Model.$id).toBe(id)
    },
  )

  it('retains nested schema bases when tree shaking a selected property', async () => {
    const requested: string[] = []
    const input = {
      openapi: '3.2.1',
      $self: 'https://example.com/api/openapi.yaml',
      item: { $ref: 'models.yaml#/components/schemas/Model/properties/nested/properties/value' },
    }
    const plugins: LoaderPlugin[] = [
      {
        type: 'loader',
        validate: () => true,
        exec: (uri) => {
          requested.push(uri)
          const data =
            uri === 'https://example.com/api/models.yaml'
              ? {
                  openapi: '3.2.1',
                  $self: 'https://example.com/canonical/openapi.yaml',
                  components: {
                    schemas: {
                      Model: {
                        $id: 'models/model.json',
                        properties: {
                          nested: { $id: 'nested/part.json', properties: { value: { $ref: 'value.yaml' } } },
                        },
                      },
                    },
                  },
                }
              : { type: 'string' }
          return Promise.resolve({ ok: true, data, raw: JSON.stringify(data) })
        },
      },
    ]
    await bundle(input, { depth: 1, plugins: [openApiDocument(), ...plugins], treeShake: true, urlMap: true })
    await bundle(input, { plugins: [openApiDocument(), ...plugins], treeShake: true, urlMap: true })
    expect(requested).toStrictEqual([
      'https://example.com/api/models.yaml',
      'https://example.com/canonical/models/nested/value.yaml',
    ])
  })

  it('retains the declared base of a tree-shaken document across partial bundles', async () => {
    const requested: string[] = []
    const input = {
      openapi: '3.2.1',
      $self: 'https://example.com/api/openapi.yaml',
      item: { $ref: 'models.yaml#/components/schemas/Model' },
    }
    const plugins: LoaderPlugin[] = [
      {
        type: 'loader',
        validate: () => true,
        exec: (uri) => {
          requested.push(uri)
          const data =
            uri === 'https://example.com/api/models.yaml'
              ? {
                  openapi: '3.2.1',
                  $self: 'https://example.com/canonical/openapi.yaml',
                  components: { schemas: { Model: { properties: { value: { $ref: 'value.yaml' } } } } },
                }
              : { type: 'string' }
          return Promise.resolve({ ok: true, data, raw: JSON.stringify(data) })
        },
      },
    ]
    await bundle(input, { depth: 1, plugins: [openApiDocument(), ...plugins], treeShake: true, urlMap: true })
    await bundle(input, { plugins: [openApiDocument(), ...plugins], treeShake: true, urlMap: true })
    expect(requested).toStrictEqual(['https://example.com/api/models.yaml', 'https://example.com/canonical/value.yaml'])
  })

  it('rewrites absolute references to relative schema identifiers for downstream resolution', async () => {
    const input = {
      openapi: '3.2.1',
      $self: 'https://example.com/openapi.yaml',
      components: {
        schemas: {
          Order: { $id: 'models/order.json', type: 'string' },
          Ref: { $ref: 'https://example.com/models/order.json' },
        },
      },
    }
    await bundle(input, { plugins: [openApiDocument()], treeShake: false })
    expect(input.components.schemas.Ref.$ref).toBe('#/components/schemas/Order')
    expect(createMagicProxy(input, { documentUri: input.$self }).components.schemas.Ref).toStrictEqual({
      $ref: '#/components/schemas/Order',
      '$ref-value': { $id: 'models/order.json', type: 'string' },
    })
  })

  it('retains unresolved schema pointers', async () => {
    const input = {
      openapi: '3.2.1',
      $self: 'https://example.com/openapi.yaml',
      components: { schemas: { Order: { $id: 'order.json', $ref: '#/missing' } } },
    }
    await bundle(input, { plugins: [openApiDocument()], treeShake: false })
    expect(input.components.schemas.Order.$ref).toBe('#/missing')
  })

  it.each([
    ['https://example.com/api/', 'https://example.com/api/models.yaml', 'https://example.com/api/value.yaml'],
    ['/tmp/api/', '/tmp/api/models.yaml', '/tmp/api/value.yaml'],
  ])('preserves directory bases between partial bundles for %s', async (self, modelUri, valueUri) => {
    const requested: string[] = []
    const input = { openapi: '3.2.1', $self: self, item: { $ref: 'models.yaml' } }
    const plugins: LoaderPlugin[] = [
      {
        type: 'loader',
        validate: () => true,
        exec: (uri) => {
          requested.push(uri)
          const data = uri === modelUri ? { child: { $ref: 'value.yaml' } } : { type: 'string' }
          return Promise.resolve({ ok: true, data, raw: JSON.stringify(data) })
        },
      },
    ]
    await bundle(input, { depth: 1, plugins: [openApiDocument(), ...plugins], urlMap: true, treeShake: false })
    await bundle(input, { plugins: [openApiDocument(), ...plugins], urlMap: true, treeShake: false })
    expect(requested).toStrictEqual([modelUri, valueUri])
  })

  it.each([true, false])(
    'resolves supplied document identities from the cache with treeShake %s',
    async (treeShake) => {
      const external = {
        openapi: '3.2.1',
        $self: 'https://example.com/models/openapi.yaml',
        components: { schemas: { First: { type: 'string' }, Second: { type: 'number' } } },
      }
      const cache = new Map([
        [
          'https://mirror.example.com/models.yaml',
          Promise.resolve({ ok: true as const, data: external, raw: JSON.stringify(external) }),
        ],
      ])
      const document = {
        openapi: '3.2.1',
        $self: 'https://example.com/openapi.yaml',
        components: {
          schemas: {
            First: { $ref: 'models/openapi.yaml#/components/schemas/First' },
            Second: { $ref: 'models/openapi.yaml#/components/schemas/Second' },
          },
        },
      }
      await bundle(document, { plugins: [openApiDocument()], treeShake, cache, urlMap: true })
      expect(
        getValueByPath(document, getSegmentsFromPath(document.components.schemas.First.$ref.slice(1))).value,
      ).toStrictEqual({ type: 'string' })
      expect(
        getValueByPath(document, getSegmentsFromPath(document.components.schemas.Second.$ref.slice(1))).value,
      ).toStrictEqual({ type: 'number' })
      const previous = structuredClone(document)
      await bundle(document, { plugins: [openApiDocument()], treeShake, cache, urlMap: true })
      expect(document).toStrictEqual(previous)
    },
  )

  it('keeps example payload $self fields out of resolution context and reports the document base to hooks', async () => {
    const origins: string[] = []
    const document = {
      openapi: '3.2.1',
      $self: 'https://example.com/api/openapi.yaml',
      servers: [{ url: './server' }],
      components: { examples: { Example: { value: { openapi: '3.2.1', $self: 'https://unrelated.example.com/' } } } },
    }
    await bundle(document, {
      plugins: [openApiDocument()],
      treeShake: false,
      hooks: {
        onBeforeNodeProcess: (_node, context) => {
          origins.push(context.origin)
        },
      },
    })
    expect([...new Set(origins)]).toStrictEqual(['https://example.com/api/openapi.yaml'])
    expect(document.servers).toStrictEqual([{ url: './server' }])
  })

  it.each([
    [
      'https://schemas.example.com/v2/openapi.yaml',
      'https://mirror.example.com/api.yaml',
      './models/order.yaml',
      'https://schemas.example.com/v2/models/order.yaml',
    ],
    [
      '/v2/openapi.yaml',
      'https://mirror.example.com/api.yaml',
      './models/order.yaml',
      'https://mirror.example.com/v2/models/order.yaml',
    ],
    [
      '../v2/',
      'https://mirror.example.com/api/openapi.yaml',
      'order.yaml?version=2',
      'https://mirror.example.com/v2/order.yaml?version=2',
    ],
    ['', 'https://mirror.example.com/api/openapi.yaml', 'order.yaml', 'https://mirror.example.com/api/order.yaml'],
    ['https://schemas.example.com/v2/', undefined, 'order.yaml', 'https://schemas.example.com/v2/order.yaml'],
  ])('resolves references using $self %s', async (self, origin, ref, expected) => {
    const requested: string[] = []
    const document = {
      openapi: '3.2.1',
      $self: self,
      info: { title: 'Orders', version: '1' },
      paths: {},
      components: { schemas: { Order: { $ref: ref } } },
    }
    await bundle(document, {
      origin,
      treeShake: false,
      plugins: [
        openApiDocument(),
        {
          type: 'loader',
          validate: () => true,
          exec: (uri) => {
            requested.push(uri)
            return Promise.resolve({ ok: true, data: { type: 'string' }, raw: '{"type":"string"}' })
          },
        },
      ],
    })
    expect(requested).toStrictEqual([expected])
    const refPath = getSegmentsFromPath(document.components.schemas.Order.$ref.slice(1))
    expect(getValueByPath(document, refPath).value).toStrictEqual({ type: 'string' })
  })

  it.each([true, false])(
    'resolves canonical identities across external documents with treeShake %s',
    async (treeShake) => {
      const requested: string[] = []
      const document = {
        openapi: '3.2.1',
        $self: 'https://example.com/api/openapi.yaml',
        components: {
          schemas: {
            Local: { type: 'string' },
            External: { $ref: 'shared.yaml#/components/schemas/Shared' },
            Self: { $ref: 'https://example.com/api/openapi.yaml#/components/schemas/Local' },
          },
        },
      }
      const external = {
        openapi: '3.2.1',
        $self: 'https://example.com/shared/openapi.yaml',
        components: {
          schemas: {
            Shared: {
              type: 'object',
              properties: {
                local: { $ref: 'openapi.yaml#/components/schemas/Value' },
                back: { $ref: '../api/openapi.yaml#/components/schemas/Local' },
                remote: { $ref: 'value.yaml' },
              },
            },
            Value: { type: 'number' },
          },
        },
      }
      await bundle(document, {
        treeShake,
        plugins: [
          openApiDocument(),
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) => {
              requested.push(uri)
              const data = uri === 'https://example.com/api/shared.yaml' ? external : { type: 'boolean' }
              return Promise.resolve({ ok: true, data, raw: JSON.stringify(data) })
            },
          },
        ],
      })
      expect(requested).toStrictEqual(['https://example.com/api/shared.yaml', 'https://example.com/shared/value.yaml'])
      expect(document.components.schemas.Self.$ref).toBe('#/components/schemas/Local')
      const shared = getValueByPath(
        document,
        getSegmentsFromPath(document.components.schemas.External.$ref.slice(1)),
      ).value
      expect(getValueByPath(document, getSegmentsFromPath(shared.properties.local.$ref.slice(1))).value).toStrictEqual({
        type: 'number',
      })
      expect(shared.properties.back.$ref).toBe('#/components/schemas/Local')
    },
  )

  it('uses the enclosing $self and relative schema $id when partially bundling', async () => {
    const requested: string[] = []
    const root = {
      openapi: '3.2.1',
      $self: 'https://example.com/api/openapi.yaml',
      components: {
        schemas: {
          Order: {
            $id: 'models/order.json',
            properties: { value: { $ref: 'value.json' } },
          },
        },
      },
    }
    await bundle(root.components.schemas.Order.properties, {
      root,
      treeShake: false,
      plugins: [
        openApiDocument(),
        {
          type: 'loader',
          validate: () => true,
          exec: (uri) => {
            requested.push(uri)
            return Promise.resolve({ ok: true, data: { type: 'string' }, raw: '{"type":"string"}' })
          },
        },
      ],
    })
    expect(requested).toStrictEqual(['https://example.com/api/models/value.json'])
  })

  it('ignores identity fields outside an OpenAPI document', () => {
    expect(resolveOpenApiDocument({ $self: 'https://example.com/' }, '/input.json')).toBeUndefined()
    expect(resolveOpenApiDocument({ openapi: '3.2.1', $self: 42 }, '/input.json')).toBeUndefined()
  })
})
