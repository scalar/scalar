import { bundle } from '@scalar/json-magic/bundle'
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'
import YAML from 'yaml'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { removeExtraScalarKeys } from '@/plugins/bundler'
import { isOpenApiDocument } from '@/schemas/type-guards'
import { createServerWorkspaceStore } from '@/server'

import { normalizeBooleanSchemas } from './normalize-boolean-schemas'

const anySchema = { __scalar_: '' }
const neverSchema = { __scalar_: '', not: anySchema }

describe('normalize-boolean-schemas', () => {
  it('shares unchanged bundled documents and opaque payloads while copying changed ancestors', () => {
    const opaque = { properties: { items: false }, items: [{ schema: true }] }
    const untouched = { openapi: '3.1.0', components: { schemas: { Thing: { type: 'string' } } } }
    const document = {
      components: { schemas: { Changed: { properties: { blocked: false }, example: opaque } } },
      'x-ext': { untouched },
    }
    const normalized = normalizeBooleanSchemas(document)
    expect(normalized).not.toBe(document)
    expect(normalized['x-ext']).toBe(document['x-ext'])
    expect(normalized.components.schemas.Changed.example).toBe(opaque)
    expect(document.components.schemas.Changed.properties.blocked).toBe(false)
    expect(normalized.components.schemas.Changed.properties.blocked).toStrictEqual(neverSchema)
    expect(normalizeBooleanSchemas({ 'x-ext': { untouched } })['x-ext'].untouched).toBe(untouched)
  })

  it('preserves opaque literal properties and items in external documents', () => {
    const value = { properties: { items: false }, items: { schema: true }, default: { schema: false } }
    const document = {
      components: { schemas: { Alias: { $ref: '#/x-ext/schema' } } },
      'x-ext': {
        schema: { properties: { blocked: false }, example: value, default: value, const: value, enum: [value] },
        examples: { value, dataValue: value },
        'x-custom': value,
      },
      'x-custom': { properties: { blocked: false } },
    }
    const normalized = normalizeBooleanSchemas(document)
    for (const key of ['example', 'default', 'const'] as const) {
      expect(normalized['x-ext'].schema[key]).toBe(value)
    }
    expect(normalized['x-ext'].schema.enum).toBe(document['x-ext'].schema.enum)
    expect(normalized['x-ext'].examples).toBe(document['x-ext'].examples)
    expect(normalized['x-custom']).toBe(document['x-custom'])
    expect(normalized['x-ext'].schema.properties.blocked).toStrictEqual(neverSchema)
  })

  it.each([false, true])('normalizes a shared external boolean target regardless of reference order: %s', (reverse) => {
    const entries = [
      ['First', { $ref: '#/x-ext/target' }],
      ['Second', { $ref: '#/x-ext/target' }],
    ] as const
    const document = {
      components: { schemas: Object.fromEntries(reverse ? [...entries].reverse() : entries) },
      'x-ext': { target: false },
    }
    const normalized = normalizeBooleanSchemas(document)
    expect(normalized['x-ext'].target).toStrictEqual(neverSchema)
    expect(normalized.components.schemas.First?.$ref).toBe('#/x-ext/target')
    expect(normalized.components.schemas.Second?.$ref).toBe('#/x-ext/target')
    expect(document['x-ext'].target).toBe(false)
    const proxied = createMagicProxy(normalized)
    expect(JSON.parse(JSON.stringify(getResolvedRef(proxied.components.schemas.First)))).toStrictEqual({ not: {} })
    expect(JSON.parse(JSON.stringify(getResolvedRef(proxied.components.schemas.Second)))).toStrictEqual({ not: {} })
  })

  it('normalizes a deeply nested schema without recursive cloning or traversal', () => {
    let schema: unknown = false
    for (let depth = 0; depth < 20_000; depth++) {
      schema = { items: schema }
    }
    const document = { components: { schemas: { Deep: schema } } }
    const normalized = normalizeBooleanSchemas(document)
    let result = normalized.components.schemas.Deep
    for (let depth = 0; depth < 20_000; depth++) {
      result = (result as { items: unknown }).items
    }
    expect(result).toStrictEqual(neverSchema)
  })

  it('normalizes streaming item schemas and arbitrary OpenAPI 3.2 map names', () => {
    const document = {
      components: {
        mediaTypes: {
          example: { itemSchema: false },
          'x-stream': { schema: true },
          schema: { schema: false },
          itemSchema: { itemSchema: false },
        },
      },
      paths: {
        '/stream': {
          additionalOperations: {
            'x-custom': { requestBody: { content: { 'application/jsonl': { itemSchema: false } } } },
          },
        },
      },
    }
    expect(normalizeBooleanSchemas(document)).toStrictEqual({
      components: {
        mediaTypes: {
          example: { itemSchema: neverSchema },
          'x-stream': { schema: anySchema },
          schema: { schema: neverSchema },
          itemSchema: { itemSchema: neverSchema },
        },
      },
      paths: {
        '/stream': {
          additionalOperations: {
            'x-custom': { requestBody: { content: { 'application/jsonl': { itemSchema: neverSchema } } } },
          },
        },
      },
    })
  })

  it('preserves structured dataValue example payloads', () => {
    const document = {
      components: { examples: { event: { dataValue: { schema: false, itemSchema: true } } } },
      'x-ext': { event: { dataValue: { schema: false, itemSchema: true } } },
    }
    const original = structuredClone(document)
    expect(normalizeBooleanSchemas(document)).toStrictEqual(original)
  })

  it('normalizes referenced external schemas and recursive targets', () => {
    const document = {
      components: { schemas: { Alias: { $ref: '#/x-ext/never~1schema' }, Node: { $ref: '#/x-ext/node' } } },
      'x-ext': {
        'never/schema': false,
        node: { properties: { forbidden: false, child: { $ref: '#/x-ext/node' } } },
      },
    }
    const normalized = normalizeBooleanSchemas(document)
    expect(normalized['x-ext']).toStrictEqual({
      'never/schema': neverSchema,
      node: { properties: { forbidden: neverSchema, child: { $ref: '#/x-ext/node' } } },
    })
  })

  it('preserves normalized external schema targets through server ingestion', async () => {
    const document = {
      openapi: '3.1.1',
      info: { title: 'External boolean schema', version: '1' },
      components: { schemas: { Alias: { $ref: '#/x-ext/external' } } },
      'x-ext': { external: false },
    }
    const store = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com',
      documents: [{ name: 'boolean', document }],
    })
    expect(store.getWorkspace().documents.boolean).toMatchObject({ 'x-ext': { external: neverSchema } })
    expect(document['x-ext'].external).toBe(false)
  })

  it('preserves the semantics of root and nested boolean schemas', () => {
    const document = {
      components: {
        schemas: {
          Any: true,
          Never: false,
          Object: {
            type: 'object',
            properties: { allowed: true, forbidden: false },
            allOf: [true, false],
            not: false,
            items: false,
            prefixItems: [true, false],
            patternProperties: { '^x': false },
            propertyNames: false,
            $defs: { Never: false },
            if: true,
            then: false,
            else: true,
            additionalProperties: false,
          },
        },
      },
    }
    expect(normalizeBooleanSchemas(document)).toStrictEqual({
      components: {
        schemas: {
          Any: anySchema,
          Never: neverSchema,
          Object: {
            type: 'object',
            properties: { allowed: anySchema, forbidden: neverSchema },
            allOf: [anySchema, neverSchema],
            not: neverSchema,
            items: neverSchema,
            prefixItems: [anySchema, neverSchema],
            patternProperties: { '^x': neverSchema },
            propertyNames: neverSchema,
            $defs: { Never: neverSchema },
            if: anySchema,
            then: neverSchema,
            else: anySchema,
            additionalProperties: false,
          },
        },
      },
    })
  })

  it('leaves boolean annotations and example data unchanged', () => {
    const document = {
      components: {
        schemas: {
          Example: {
            type: 'object',
            readOnly: true,
            writeOnly: false,
            deprecated: true,
            example: { schema: false, properties: { named: true } },
            default: false,
            const: true,
            enum: [true, false],
            properties: { example: false },
          },
        },
        examples: { schema: { value: { schema: false } } },
      },
      'x-custom': { schema: false },
      paths: { '/test': { get: { responses: { schema: { description: 'Named response' } } } } },
    }
    const original = structuredClone(document)
    const normalized = normalizeBooleanSchemas(document)
    expect(document).toStrictEqual(original)
    expect(normalized).toStrictEqual({
      ...original,
      components: {
        ...original.components,
        schemas: {
          Example: { ...original.components.schemas.Example, properties: { example: neverSchema } },
        },
      },
    })
  })

  it('normalizes inline and resolved external schemas without changing named maps', () => {
    const document = {
      paths: {
        '/test': {
          post: {
            requestBody: { content: { 'application/json': { schema: false } } },
            responses: {
              '200': { content: { 'application/json': { schema: { $ref: './external.json', '$ref-value': false } } } },
            },
          },
        },
      },
    }
    expect(normalizeBooleanSchemas(document)).toStrictEqual({
      paths: {
        '/test': {
          post: {
            requestBody: { content: { 'application/json': { schema: neverSchema } } },
            responses: {
              '200': {
                content: { 'application/json': { schema: { $ref: './external.json', '$ref-value': neverSchema } } },
              },
            },
          },
        },
      },
    })
  })

  it('terminates on shared and recursive schema objects', () => {
    const recursive: Record<string, unknown> = { type: 'object' }
    recursive.properties = { child: recursive, forbidden: false }
    const document = { components: { schemas: { Node: recursive, Alias: recursive } } }
    const normalized = normalizeBooleanSchemas(document)
    const node = normalized.components.schemas.Node
    expect(node.properties).toStrictEqual({ child: node, forbidden: neverSchema })
    expect(normalized.components.schemas.Alias).toBe(node)
    expect(recursive.properties).toStrictEqual({ child: recursive, forbidden: false })
  })
  it.each([
    { openapi: '3.1.1', additionalProperties: false },
    { openapi: '3.1.1', additionalProperties: true },
    { openapi: '3.2.0', additionalProperties: false },
    { openapi: '3.2.0', additionalProperties: true },
  ])(
    'preserves additionalProperties: $additionalProperties across $openapi saves and exports',
    async ({ openapi, additionalProperties }) => {
      const store = createWorkspaceStore()
      const input = {
        openapi,
        info: { title: 'Boolean schemas', version: '1' },
        components: {
          schemas: {
            Any: true,
            Never: false,
            Object: {
              type: 'object',
              additionalProperties,
              properties: { allowed: true, forbidden: false },
              example: { forbidden: false },
            },
          },
        },
      }
      await store.addDocument({ name: 'boolean', document: input })
      const document = store.workspace.documents.boolean
      if (!document || !isOpenApiDocument(document)) {
        throw new Error('Expected an OpenAPI document')
      }
      const expectedSchemas = {
        Any: {},
        Never: { not: {} },
        Object: {
          type: 'object',
          additionalProperties,
          properties: { allowed: {}, forbidden: { not: {} } },
          example: { forbidden: false },
        },
      }
      expect(JSON.parse(JSON.stringify(document.components?.schemas))).toStrictEqual(expectedSchemas)
      expect(input.components.schemas.Never).toBe(false)
      // getRaw is the internal backing-data API; user serialization uses the proxy view.
      expect(JSON.stringify(getRaw(document))).toContain('__scalar_')
      expect(JSON.stringify(document)).not.toContain('__scalar_')

      // Before saving, exports retain the authored document, including all boolean schemas.
      expect(JSON.parse(store.exportDocument('boolean', 'json') ?? '{}').components.schemas).toStrictEqual(
        input.components.schemas,
      )
      expect(YAML.parse(store.exportDocument('boolean', 'yaml') ?? '{}').components.schemas).toStrictEqual(
        input.components.schemas,
      )

      // Saving and editing share one cleanup boundary before either serializer runs.
      const editable = await store.getEditableDocument('boolean')
      if (!editable || !isOpenApiDocument(editable)) {
        throw new Error('Expected an editable OpenAPI document')
      }
      expect(editable.components?.schemas).toStrictEqual(expectedSchemas)
      expect(JSON.stringify(editable)).not.toContain('__scalar_')
      expect(await store.saveDocument('boolean')).toBe(true)
      for (const format of ['json', 'yaml'] as const) {
        const exported = store.exportDocument('boolean', format) ?? '{}'
        expect(exported).not.toContain('__scalar_')
        const parsed = format === 'json' ? JSON.parse(exported) : YAML.parse(exported)
        expect(parsed.components.schemas).toStrictEqual(expectedSchemas)
      }
      expect(JSON.parse(store.exportDocument('boolean', 'json', true) ?? '{}').components.schemas).toStrictEqual(
        expectedSchemas,
      )
      expect(JSON.stringify(getRaw(document))).toContain('__scalar_')
    },
  )

  it('removes normalized markers at the bundler boundary without relying on proxy filtering', async () => {
    const normalized = normalizeBooleanSchemas({
      components: {
        schemas: {
          Any: true,
          Never: false,
          Object: { type: 'object', additionalProperties: false, properties: { blocked: false } },
          List: { type: 'array', items: false },
          Choice: { anyOf: [true, false] },
        },
      },
    })
    expect(JSON.stringify(normalized)).toContain('__scalar_')
    const cleaned = await bundle(normalized, { treeShake: false, plugins: [removeExtraScalarKeys()] })
    expect(cleaned).toStrictEqual({
      components: {
        schemas: {
          Any: {},
          Never: { not: {} },
          Object: { type: 'object', additionalProperties: false, properties: { blocked: { not: {} } } },
          List: { type: 'array', items: { not: {} } },
          Choice: { anyOf: [{}, { not: {} }] },
        },
      },
    })
  })

  it.each(['3.0.4', '3.1.2', '3.2.1'])(
    'keeps authored additionalProperties booleans in original and saved exports for %s',
    async (openapi) => {
      const store = createWorkspaceStore()
      const schemas = {
        Closed: { type: 'object', additionalProperties: false },
        Open: { type: 'object', additionalProperties: true },
      }
      await store.addDocument({
        name: 'booleans',
        document: { openapi, info: { title: 'Boolean exports', version: '1' }, components: { schemas } },
      })
      const document = store.workspace.documents.booleans
      if (!document || !isOpenApiDocument(document)) {
        throw new Error('Expected an OpenAPI document')
      }
      expect(JSON.parse(JSON.stringify(document.components?.schemas))).toStrictEqual(schemas)
      for (const save of [false, true]) {
        if (save) {
          expect(await store.saveDocument('booleans')).toBe(true)
        }
        const json = store.exportDocument('booleans', 'json') ?? ''
        const yaml = store.exportDocument('booleans', 'yaml') ?? ''
        expect(JSON.parse(json).components.schemas).toStrictEqual(schemas)
        expect(YAML.parse(yaml).components.schemas).toStrictEqual(schemas)
        expect(json).not.toContain('__scalar_')
        expect(yaml).not.toContain('__scalar_')
      }
    },
  )

  it('preserves boolean schema semantics through server ingestion', async () => {
    const store = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com',
      documents: [
        {
          name: 'boolean',
          document: {
            openapi: '3.1.1',
            info: { title: 'Boolean schemas', version: '1' },
            components: { schemas: { Any: true, Never: false } },
          },
        },
      ],
    })
    expect(store.get('/boolean/components/schemas/Any')).toStrictEqual(anySchema)
    expect(store.get('/boolean/components/schemas/Never')).toStrictEqual(neverSchema)
  })

  it('preserves resolved boolean schema references during client ingestion', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'boolean',
      document: {
        openapi: '3.1.1',
        info: { title: 'Boolean schemas', version: '1' },
        components: { schemas: { Never: false, Alias: { $ref: '#/components/schemas/Never' } } },
      },
    })
    const document = store.workspace.documents.boolean
    if (!document || !isOpenApiDocument(document)) {
      throw new Error('Expected an OpenAPI document')
    }
    expect(JSON.parse(JSON.stringify(getResolvedRef(document.components?.schemas?.Alias)))).toStrictEqual({ not: {} })
  })
  it('does not confuse user-defined map keys with example or extension fields', () => {
    const document = {
      components: { parameters: { example: { name: 'example', in: 'query', schema: false } } },
      webhooks: { 'x-event': { post: { requestBody: { content: { 'application/json': { schema: false } } } } } },
    }
    expect(normalizeBooleanSchemas(document)).toStrictEqual({
      components: { parameters: { example: { name: 'example', in: 'query', schema: neverSchema } } },
      webhooks: { 'x-event': { post: { requestBody: { content: { 'application/json': { schema: neverSchema } } } } } },
    })
  })
})
