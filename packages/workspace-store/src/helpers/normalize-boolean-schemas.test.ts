import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isOpenApiDocument } from '@/schemas/type-guards'
import { createServerWorkspaceStore } from '@/server'

import { normalizeBooleanSchemas } from './normalize-boolean-schemas'

const anySchema = { __scalar_: '' }
const neverSchema = { __scalar_: '', not: anySchema }

describe('normalize-boolean-schemas', () => {
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
    normalizeBooleanSchemas(document)
    expect(document['x-ext']).toStrictEqual({
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
    normalizeBooleanSchemas(document)
    expect(document).toStrictEqual({
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
    normalizeBooleanSchemas(document)
    expect(recursive.properties).toStrictEqual({ child: recursive, forbidden: neverSchema })
    expect(document.components.schemas.Alias).toBe(recursive)
  })
  it.each(['3.1.1', '3.2.0'])('preserves boolean schema semantics through client ingestion for %s', async (openapi) => {
    const store = createWorkspaceStore()
    const input = {
      openapi,
      info: { title: 'Boolean schemas', version: '1' },
      components: {
        schemas: {
          Any: true,
          Never: false,
          Object: { type: 'object', properties: { allowed: true, forbidden: false }, example: { forbidden: false } },
        },
      },
    }
    await store.addDocument({ name: 'boolean', document: input })
    const document = store.workspace.documents.boolean
    if (!document || !isOpenApiDocument(document)) throw new Error('Expected an OpenAPI document')
    expect(JSON.parse(JSON.stringify(document.components?.schemas))).toStrictEqual({
      Any: {},
      Never: { not: {} },
      Object: { type: 'object', properties: { allowed: {}, forbidden: { not: {} } }, example: { forbidden: false } },
    })
    expect(input.components.schemas.Never).toBe(false)
  })

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
    if (!document || !isOpenApiDocument(document)) throw new Error('Expected an OpenAPI document')
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
