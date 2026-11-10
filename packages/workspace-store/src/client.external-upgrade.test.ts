import { getActiveOpenApiDocument } from '@test/helpers'
import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

const files: Record<string, string> = {
  // A complete OpenAPI 3.0 document, as in "schemas/Item.yaml#/components/schemas/Item".
  'https://example.test/schemas/Item.json': JSON.stringify({
    openapi: '3.0.3',
    info: { title: 't', version: '1' },
    components: {
      schemas: { Item: { type: 'object', properties: { name: { type: 'string', nullable: true } } } },
    },
  }),
  // A file that only holds a schema, without any version information.
  'https://example.test/schemas/Bare.json': JSON.stringify({
    type: 'object',
    properties: { name: { type: 'string', nullable: true } },
  }),
}

const fetchFile = (input: string | URL | Request): Promise<Response> => {
  const body = files[String(input)]
  return Promise.resolve(body === undefined ? new Response('', { status: 404 }) : new Response(body))
}

const getNameSchema = async (version: string, ref: string): Promise<Record<string, unknown> | undefined> => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'default',
    fetch: fetchFile,
    document: {
      openapi: version,
      info: { title: 't', version: '1' },
      paths: {
        '/items': {
          get: {
            responses: { '200': { description: 'ok', content: { 'application/json': { schema: { $ref: ref } } } } },
          },
        },
      },
    },
  })

  const document = getActiveOpenApiDocument(store)
  const pathItem = getResolvedRef(document?.paths?.['/items'])
  const operation = getResolvedRef(pathItem?.get)
  const response = getResolvedRef(operation?.responses?.['200'])
  const schema = getResolvedRef(response?.content?.['application/json']?.schema) as
    | { properties?: { name?: Record<string, unknown> } }
    | undefined
  return schema?.properties?.name
}

describe('client.external-upgrade', () => {
  it('updates earlier lazy pointers when a later lazy upgrade moves their target', async () => {
    const store = createWorkspaceStore()
    const url = 'https://example.test/shared.json'
    const data = { Parent: { nullable: true, allOf: [{ type: 'string', nullable: true }] } }
    await store.addDocument({
      name: 'default',
      fetch: (): Promise<Response> => Promise.resolve(new Response(JSON.stringify(data))),
      document: {
        openapi: '3.0.3',
        info: { title: 'Example', version: '1' },
        paths: {},
        'x-scalar-navigation': { id: 'default', type: 'document', name: 'default', title: 'Example', children: [] },
        components: {
          schemas: { Child: { $ref: url + '#/Parent/allOf/0' }, Parent: { $ref: url + '#/Parent' } },
        },
      },
    })

    await store.resolve(['components', 'schemas', 'Child'])
    await store.resolve(['components', 'schemas', 'Parent'])

    const schemas = getActiveOpenApiDocument(store)?.components?.schemas
    expect(getResolvedRef(schemas?.Child)).toStrictEqual({ type: ['string', 'null'] })
    expect(getResolvedRef(schemas?.Parent)).toStrictEqual({ anyOf: [{ type: ['string', 'null'] }, { type: 'null' }] })
  })

  it.each([false, true])('upgrades cached fragments across lazy calls (local alias: %s)', async (alias) => {
    const store = createWorkspaceStore()
    const loads: string[] = []
    const url = 'https://example.test/shared.json'
    const data = {
      First: { type: 'string', nullable: true },
      Second: alias ? { $ref: '#/Target' } : { type: 'integer', nullable: true },
      Target: { type: 'integer', nullable: true },
    }
    await store.addDocument({
      name: 'default',
      fetch: (input): Promise<Response> => {
        loads.push(String(input))
        return Promise.resolve(new Response(JSON.stringify(data)))
      },
      document: {
        openapi: '3.0.3',
        info: { title: 'Example', version: '1' },
        paths: {},
        'x-scalar-navigation': { id: 'default', type: 'document', name: 'default', title: 'Example', children: [] },
        components: {
          schemas: { First: { $ref: url + '#/First' }, Second: { $ref: url + '#/Second' } },
        },
      },
    })

    expect(loads).toStrictEqual([])
    await store.resolve(['components', 'schemas', 'First'])
    await store.resolve(['components', 'schemas', 'Second'])

    const schemas = getActiveOpenApiDocument(store)?.components?.schemas
    expect(getResolvedRef(schemas?.First)).toStrictEqual({ type: ['string', 'null'] })
    expect(getResolvedRef(schemas?.Second)).toStrictEqual({ type: ['integer', 'null'] })
    expect(loads).toStrictEqual([url])
  })

  it('upgrades a shared schema map whose names resemble document fields', async () => {
    const store = createWorkspaceStore()
    const data = {
      openapi: { type: 'string' },
      components: { type: 'string' },
      Item: { type: 'string', nullable: true, example: 'hello' },
    }
    await store.addDocument({
      name: 'default',
      fetch: (): Promise<Response> => Promise.resolve(new Response(JSON.stringify(data))),
      document: {
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        components: { schemas: { Item: { $ref: 'https://example.test/shared.json#/Item' } } },
      },
    })

    const document = getActiveOpenApiDocument(store)
    expect(getResolvedRef(document?.components?.schemas?.Item)).toStrictEqual({
      type: ['string', 'null'],
      examples: ['hello'],
    })
  })

  it('resolves an absolute reference to the entry document without another fetch', async () => {
    const store = createWorkspaceStore()
    const loads: string[] = []
    await store.addDocument({
      name: 'default',
      documentSource: 'https://example.test/openapi.json',
      fetch: (input): Promise<Response> => {
        loads.push(String(input))
        return Promise.reject(new Error('The entry document is already loaded'))
      },
      document: {
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        components: {
          schemas: {
            Item: { type: 'string', nullable: true },
            Alias: { $ref: 'https://example.test/openapi.json#/components/schemas/Item' },
          },
        },
      },
    })

    const document = getActiveOpenApiDocument(store)
    expect(getResolvedRef(document?.components?.schemas?.Alias)).toStrictEqual({ type: ['string', 'null'] })
    expect(loads).toStrictEqual([])
  })

  it.each(['', 'constructor', 'prototype'])('upgrades an external schema for property "%s"', async (name) => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      fetch: (): Promise<Response> => Promise.resolve(new Response('{"type":"string","nullable":true}')),
      document: {
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        components: {
          schemas: {
            Box: { type: 'object', properties: { [name]: { $ref: 'https://example.test/field.json' } } },
          },
        },
      },
    })

    const document = getActiveOpenApiDocument(store)
    const box = getResolvedRef(document?.components?.schemas?.Box)
    assert(box && 'properties' in box)
    expect(Object.keys(box?.properties ?? {})).toStrictEqual([name])
    expect(getResolvedRef(box?.properties?.[name])).toStrictEqual({ type: ['string', 'null'] })
  })

  it.each([
    ['Child', 'Parent'],
    ['Parent', 'Child'],
  ])('preserves literal examples when referencing %s before %s', async (first, second) => {
    const store = createWorkspaceStore()
    const literal = { type: 'string', nullable: true }
    const data = { Parent: { type: 'object', properties: { Child: { type: 'object', example: literal } } } }
    await store.addDocument({
      name: 'default',
      fetch: (): Promise<Response> => Promise.resolve(new Response(JSON.stringify(data))),
      document: {
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        components: {
          schemas: Object.fromEntries(
            [first, second].map((name) => [
              name,
              { $ref: `https://example.test/shared.json#/Parent${name === 'Child' ? '/properties/Child' : ''}` },
            ]),
          ),
        },
      },
    })

    const document = getActiveOpenApiDocument(store)
    const child = getResolvedRef(document?.components?.schemas?.Child)
    const parent = getResolvedRef(document?.components?.schemas?.Parent)
    assert(parent && 'properties' in parent)
    expect(child).toStrictEqual({ type: 'object', examples: [literal] })
    expect(getResolvedRef(parent?.properties?.Child)).toStrictEqual(child)
  })

  it('upgrades a complete OpenAPI 3.0 document next to an OpenAPI 3.0 entry document', async () => {
    const name = await getNameSchema('3.0.3', 'https://example.test/schemas/Item.json#/components/schemas/Item')

    expect(name).toMatchObject({ type: ['string', 'null'] })
    expect(name).not.toHaveProperty('nullable')
  })

  it('upgrades a complete OpenAPI 3.0 document next to an OpenAPI 3.1 entry document', async () => {
    const name = await getNameSchema('3.1.0', 'https://example.test/schemas/Item.json#/components/schemas/Item')

    expect(name).toMatchObject({ type: ['string', 'null'] })
  })

  it('upgrades a bare schema file referenced from an OpenAPI 3.0 entry document', async () => {
    const name = await getNameSchema('3.0.3', 'https://example.test/schemas/Bare.json')

    expect(name).toMatchObject({ type: ['string', 'null'] })
    expect(name).not.toHaveProperty('nullable')
  })
})
