import { isObject } from '@scalar/helpers/object/is-object'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { getActiveOpenApiDocument } from '@test/helpers'
import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { createServerWorkspaceStore } from '@/server'

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
  it.each([false, true])(
    'upgrades a schema reached through extension aliases (extension first: %s)',
    async (extensionFirst) => {
      const store = createWorkspaceStore()
      const url = 'https://example.test/schema.json'
      const loads: string[] = []
      await store.addDocument({
        name: 'default',
        fetch: (input): Promise<Response> => {
          loads.push(String(input))
          return Promise.resolve(new Response(JSON.stringify({ type: 'string', nullable: true })))
        },
        document: {
          openapi: '3.0.3',
          info: { title: 'Example', version: '1' },
          paths: {},
          ...(extensionFirst ? { 'x-schemas': { Inner: { $ref: url }, Wrapped: { $ref: '#/x-schemas/Inner' } } } : {}),
          components: { schemas: { Parent: { $ref: '#/x-schemas/Wrapped' } } },
          ...(!extensionFirst ? { 'x-schemas': { Inner: { $ref: url }, Wrapped: { $ref: '#/x-schemas/Inner' } } } : {}),
        },
      })

      const schema = getActiveOpenApiDocument(store)?.components?.schemas?.Parent
      expect(getResolvedRef(getResolvedRef(getResolvedRef(schema)))).toStrictEqual({ type: ['string', 'null'] })
      expect(loads).toStrictEqual([url])
    },
  )

  it.each([
    [false, false, false],
    [false, true, false],
    [true, false, false],
    [true, true, false],
    [false, true, true],
    [true, true, true],
  ] as const)(
    'keeps a literal reference in an external example (lazy: %s, shared file: %s, alias: %s)',
    async (lazy, shared, alias) => {
      const store = createWorkspaceStore()
      const schemaUrl = 'https://example.test/shared.json'
      const exampleUrl = shared ? schemaUrl + '#/Example' : 'https://example.test/example.json'
      const literal = {
        $ref: alias ? '#/components/schemas/Parent' : schemaUrl + '#/Parent/allOf/0',
        label: 'payload',
        details: { count: 1, externalValue: './raw-value' },
      }
      const parent = { nullable: true, allOf: [{ type: 'string' }] }
      const example = { value: literal }
      const sharedFile = alias
        ? { Parent: parent, Example: { $ref: '#/ExampleValue' }, ExampleValue: example }
        : { Parent: parent, ...(shared ? { Example: example } : {}) }
      await store.addDocument({
        name: 'default',
        fetch: (input): Promise<Response> =>
          Promise.resolve(new Response(JSON.stringify(String(input) === exampleUrl ? example : sharedFile))),
        document: {
          openapi: '3.0.3',
          info: { title: 'Example', version: '1' },
          paths: {},
          ...(lazy
            ? {
                'x-scalar-navigation': {
                  id: 'default',
                  type: 'document',
                  name: 'default',
                  title: 'Example',
                  children: [],
                },
              }
            : {}),
          components: {
            schemas: { Parent: { $ref: schemaUrl + '#/Parent' } },
            examples: { Literal: { $ref: exampleUrl } },
          },
        },
      })

      if (lazy) {
        await store.resolve(['components', 'schemas', 'Parent'])
        await store.resolve(['components', 'examples', 'Literal'])
      }

      const resolved = getResolvedRef(getActiveOpenApiDocument(store)?.components?.examples?.Literal)
      expect(getRaw(resolved?.value)).toStrictEqual(literal)
    },
  )

  it('upgrades both shared fragments when lazy calls overlap', async () => {
    const store = createWorkspaceStore()
    const url = 'https://example.test/shared.json'
    const loads: string[] = []
    let release = (): void => {}
    const responseReady = new Promise<void>((resolve) => {
      release = resolve
    })
    await store.addDocument({
      name: 'default',
      fetch: async (input): Promise<Response> => {
        loads.push(String(input))
        await responseReady
        return new Response(
          JSON.stringify({
            A: { type: 'string', nullable: true },
            B: { type: 'integer', nullable: true },
          }),
        )
      },
      document: {
        openapi: '3.0.3',
        info: { title: 'Example', version: '1' },
        paths: {},
        'x-scalar-navigation': { id: 'default', type: 'document', name: 'default', title: 'Example', children: [] },
        components: { schemas: { A: { $ref: url + '#/A' }, B: { $ref: url + '#/B' } } },
      },
    })

    const pending = Promise.all([
      store.resolve(['components', 'schemas', 'A']),
      store.resolve(['components', 'schemas', 'B']),
    ])
    release()
    await pending

    const schemas = getActiveOpenApiDocument(store)?.components?.schemas
    expect(getResolvedRef(schemas?.A)).toStrictEqual({ type: ['string', 'null'] })
    expect(getResolvedRef(schemas?.B)).toStrictEqual({ type: ['integer', 'null'] })
    expect(loads).toStrictEqual([url])
  })

  it.each([
    [false, 'Parent'],
    [true, 'Parent'],
    [false, '0'],
    [true, '0'],
  ] as const)(
    'updates earlier lazy pointers when a later upgrade moves their target (alias: %s, key: %s)',
    async (alias, key) => {
      const store = createWorkspaceStore()
      const url = 'https://example.test/shared.json'
      const parent = { nullable: true, allOf: [{ type: 'string', nullable: true }] }
      const data = key === '0' ? [parent] : { Parent: parent }
      await store.addDocument({
        name: 'default',
        fetch: (): Promise<Response> => Promise.resolve(new Response(JSON.stringify(data))),
        document: {
          openapi: '3.0.3',
          info: { title: 'Example', version: '1' },
          paths: {},
          'x-scalar-navigation': { id: 'default', type: 'document', name: 'default', title: 'Example', children: [] },
          components: {
            schemas: {
              Alias: { $ref: '#/components/schemas/Child' },
              Child: { $ref: url + `#/${key}/allOf/0` },
              Parent: { $ref: url + `#/${key}` },
            },
          },
        },
      })

      await store.resolve(['components', 'schemas', alias ? 'Alias' : 'Child'])
      await store.resolve(['components', 'schemas', 'Parent'])

      const schemas = getActiveOpenApiDocument(store)?.components?.schemas
      expect(getResolvedRef(schemas?.Child)).toStrictEqual({ type: ['string', 'null'] })
      expect(getResolvedRef(schemas?.Parent)).toStrictEqual({ anyOf: [{ type: ['string', 'null'] }, { type: 'null' }] })
    },
  )

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

  it.each(['allOf', 'anyOf', 'oneOf'] as const)('upgrades a bare schema referenced from %s', async (keyword) => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      fetch: (): Promise<Response> => Promise.resolve(new Response('{"type":"string","nullable":true}')),
      document: {
        openapi: '3.0.3',
        info: { title: 'Example', version: '1' },
        paths: {},
        components: {
          schemas: { Wrapper: { [keyword]: [{ $ref: 'https://example.test/schema.json' }] } },
        },
      },
    })

    const wrapper = getResolvedRef(getActiveOpenApiDocument(store)?.components?.schemas?.Wrapper)
    assert(wrapper && keyword in wrapper)
    const arms = wrapper[keyword]
    assert(Array.isArray(arms))
    expect(getResolvedRef(arms[0])).toStrictEqual({ type: ['string', 'null'] })
  })

  it.each([false, true])('uses the source dialect for server chunks (local alias: %s)', async (alias) => {
    const external = 'https://example.test/schema.json'
    const literal = { type: 'string', nullable: true }
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.test',
      documents: [
        {
          name: 'default',
          document: {
            openapi: '3.0.3',
            info: { title: 'Example', version: '1' },
            paths: {},
            components: {
              schemas: {
                Parent: {
                  type: 'object',
                  example: literal,
                  properties: { child: { $ref: alias ? '#/components/schemas/Target' : external } },
                },
                Target: { type: 'object', properties: { value: { $ref: external } } },
              },
            },
          },
        },
      ],
    })
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: server.getWorkspace().documents.default!,
      fetch: (input): Promise<Response> =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              String(input) === external
                ? literal
                : server.get('#/default/components/schemas/' + new URL(String(input)).pathname.split('/').at(-1)),
            ),
          ),
        ),
    })

    await store.resolve(['components', 'schemas', 'Parent'])

    const parent = getResolvedRef(getActiveOpenApiDocument(store)?.components?.schemas?.Parent)
    assert(parent && 'properties' in parent)
    expect(parent.examples).toStrictEqual([literal])
    const child = getResolvedRef(parent.properties?.child)
    if (alias) {
      assert(isObject(child) && isObject(child.properties))
      expect(getResolvedRef(child.properties.value)).toStrictEqual({ type: ['string', 'null'] })
    } else {
      expect(child).toStrictEqual({ type: ['string', 'null'] })
    }
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
