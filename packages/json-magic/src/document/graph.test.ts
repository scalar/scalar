import { describe, expect, it } from 'vitest'

import { checkDocument } from './graph'

const origin = '/api.json'
const api = (schema: unknown): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title: 'API', version: '1' },
  paths: {
    '/pets': { get: { responses: { '200': { description: 'OK', content: { 'application/json': { schema } } } } } },
  },
})
const prune = (document: Record<string, unknown>): Record<string, unknown> => {
  const result = checkDocument(document, { origin, prune: true })
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return document
}

describe('graph', () => {
  it.each([false, true])(
    'returns an error for a relative reference against an opaque schema base (prune: %s)',
    (prune) => {
      const document = api({ $id: 'urn:example:pet', $ref: 'child.json' })
      const before = structuredClone(document)

      expect(checkDocument(document, { origin, prune })).toStrictEqual({
        ok: false,
        error:
          '/paths/~1pets/get/responses/200/content/application~1json/schema: Reference target does not exist: child.json',
        message: undefined,
      })
      expect(document).toStrictEqual(before)
    },
  )

  it('retains reusable content when an opaque base prevents resolving an external reference', () => {
    const document = {
      ...api({ $id: 'urn:example:pet', $ref: 'child.json' }),
      components: { schemas: { Unused: { type: 'string' } } },
    }
    const before = structuredClone(document)

    expect(checkDocument(document, { origin, prune: true, unresolvedReferences: 'retain' })).toStrictEqual({
      ok: true,
      data: {
        document,
        warnings: [
          'Skipping unused-component removal because preserved external references make reachability uncertain.',
          '/paths/~1pets/get/responses/200/content/application~1json/schema: Reference target does not exist: child.json',
        ],
      },
    })
    expect(document).toStrictEqual(before)
  })

  it.each(['error', 'retain'] as const)(
    'returns an error for a relative schema identity against an opaque base (%s)',
    (unresolvedReferences) => {
      const document = api({
        $id: 'urn:example:pet',
        properties: { child: { $id: 'child.json', type: 'string' } },
      })
      const before = structuredClone(document)

      expect(checkDocument(document, { origin, prune: true, unresolvedReferences })).toStrictEqual({
        ok: false,
        error:
          '/paths/~1pets/get/responses/200/content/application~1json/schema/properties/child: Cannot resolve schema identity child.json against urn:example:pet',
        message: undefined,
      })
      expect(document).toStrictEqual(before)
    },
  )

  it('resolves absolute identities and fragment references under opaque schema bases', () => {
    const document = {
      ...api({ $ref: 'urn:example:pet' }),
      components: {
        schemas: {
          Pet: { $id: 'urn:example:pet', properties: { self: { $ref: '#' }, child: { $ref: 'urn:example:child' } } },
          Child: { $id: 'urn:example:child', type: 'string' },
          Unused: { type: 'number' },
        },
      },
    }

    prune(document)

    expect(Object.keys(document.components.schemas)).toStrictEqual(['Pet', 'Child'])
  })

  it('indexes shared schema objects under each parent while terminating object cycles', () => {
    const shared = { $id: 'pet.json', $anchor: 'pet', type: 'string' }
    const cycle: Record<string, unknown> = {}
    cycle.properties = { self: cycle }
    const document = {
      ...api({
        oneOf: [{ $ref: 'https://example.com/a/pet.json#pet' }, { $ref: 'https://example.com/b/pet.json#pet' }],
      }),
      components: {
        schemas: {
          A: { $id: 'https://example.com/a/', properties: { pet: shared } },
          B: { $id: 'https://example.com/b/', properties: { pet: shared } },
          Unused: cycle,
        },
      },
    }

    prune(document)

    expect(Object.keys(document.components.schemas)).toStrictEqual(['A', 'B'])
    expect(document.components.schemas.A.properties.pet).toBe(shared)
    expect(document.components.schemas.B.properties.pet).toBe(shared)
  })

  it.each(['3.0.3', '3.1.0', '3.2.0'])(
    'follows transitive reusable objects and keeps only reachable cycles in %s',
    (openapi) => {
      const document = {
        ...api({ $ref: '#/components/schemas/A' }),
        openapi,
        components: {
          schemas: {
            A: { properties: { b: { $ref: '#/components/schemas/B' } } },
            B: { properties: { a: { $ref: '#/components/schemas/A' } } },
            C: { $ref: '#/components/schemas/D' },
            D: { $ref: '#/components/schemas/C' },
          },
        },
      }
      prune(document)
      expect(Object.keys(document.components.schemas)).toEqual(['A', 'B'])
    },
  )

  it('follows OpenAPI 2 reusable responses, parameters and security names', () => {
    const document = {
      swagger: '2.0',
      security: [{ 'key/~': [] }],
      paths: {
        '/pets': {
          parameters: [{ $ref: '#/parameters/id' }],
          get: { responses: { '200': { $ref: '#/responses/Pet' } } },
        },
      },
      responses: { Pet: { schema: { $ref: '#/definitions/Pet' } }, Dead: { description: 'unused' } },
      parameters: { id: { name: 'id', in: 'query', type: 'string' }, dead: {} },
      definitions: { Pet: { type: 'string' }, Dead: { type: 'number' } },
      securityDefinitions: { 'key/~': { type: 'apiKey' }, unused: { type: 'basic' } },
    }
    prune(document)
    expect(Object.keys(document.responses)).toEqual(['Pet'])
    expect(Object.keys(document.parameters)).toEqual(['id'])
    expect(Object.keys(document.definitions)).toEqual(['Pet'])
    expect(Object.keys(document.securityDefinitions)).toEqual(['key/~'])
  })

  it('retains OpenAPI 2 discriminator descendants through allOf', () => {
    const document = {
      swagger: '2.0',
      paths: {
        '/pets': { get: { responses: { '200': { description: 'OK', schema: { $ref: '#/definitions/Pet' } } } } },
      },
      definitions: {
        Pet: { type: 'object', discriminator: 'kind', required: ['kind'], properties: { kind: { type: 'string' } } },
        Cat: { allOf: [{ $ref: '#/definitions/Pet' }] },
        Kitten: { allOf: [{ $ref: '#/definitions/Cat' }] },
        Dead: { discriminator: 'unused' },
        DeadChild: { allOf: [{ $ref: '#/definitions/Dead' }] },
      },
    }
    prune(document)
    expect(Object.keys(document.definitions)).toEqual(['Pet', 'Cat', 'Kitten'])
  })

  it.each(['3.0.4', '3.1.2', '3.2.1'])(
    'retains implicit subtypes alongside a partial mapping in OpenAPI %s',
    (openapi) => {
      const document = {
        ...api({ $ref: '#/components/schemas/Pet' }),
        openapi,
        components: {
          schemas: {
            Pet: { discriminator: { propertyName: 'kind', mapping: { feline: 'Cat' } } },
            Cat: { allOf: [{ $ref: '#/components/schemas/Pet' }] },
            Lizard: { allOf: [{ $ref: '#/components/schemas/Pet' }] },
            Dead: {},
          },
        },
      }
      prune(document)
      expect(Object.keys(document.components.schemas)).toEqual(['Pet', 'Cat', 'Lizard'])
    },
  )

  it('follows 3.2 security scheme URIs with precedence for component names', () => {
    const document = {
      ...api({}),
      openapi: '3.2.1',
      security: [{ '#/components/securitySchemes/Local': [], 'https://example.com/named': [] }] as Record<
        string,
        string[]
      >[],
      components: {
        securitySchemes: {
          Local: { type: 'http', scheme: 'basic' },
          'https://example.com/named': { type: 'http', scheme: 'bearer' },
          Dead: {},
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.securitySchemes)).toEqual(['Local', 'https://example.com/named'])
    document.security = [{ './remote.json': [] }]
    const result = checkDocument(document, { origin, prune: true, unresolvedReferences: 'retain' })
    expect(result.ok && result.data.warnings.at(-1)).toBe('/: Reference target does not exist: ./remote.json')
  })

  it('keeps AsyncAPI 3 channels and their dependencies without operations', () => {
    const document = {
      asyncapi: '3.0.0',
      channels: { events: { address: 'events', messages: { event: { $ref: '#/components/messages/Event' } } } },
      components: { messages: { Event: { payload: { type: 'string' } }, Dead: {} }, channels: { Dead: {} } },
    }
    prune(document)
    expect(Object.keys(document.channels)).toEqual(['events'])
    expect(Object.keys(document.components.messages)).toEqual(['Event'])
    expect(document.components.channels).toEqual({})
  })

  it('retains dependencies from callbacks and webhooks and follows both kinds of links', () => {
    const response = { description: 'OK' }
    const document = {
      ...api({}),
      paths: {
        '/pets': {
          get: {
            responses: { '200': response },
            callbacks: { event: { $ref: '#/components/callbacks/Event' } },
          },
        },
      },
      webhooks: { event: { $ref: '#/components/pathItems/Webhook' } },
      components: {
        callbacks: {
          Event: {
            '{$request.body#/url}': {
              post: {
                responses: {
                  '200': { ...response, links: { target: { operationId: 'first' } } },
                },
              },
            },
          },
          Dead: {},
        },
        pathItems: {
          Webhook: {
            post: {
              responses: {
                '200': {
                  ...response,
                  links: {
                    target: { operationRef: '#/components/pathItems/Second/get' },
                  },
                },
              },
            },
          },
          First: { get: { operationId: 'first', responses: { '200': response } } },
          Second: { get: { operationId: 'second', responses: { '200': response } } },
          Dead: {},
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.callbacks)).toEqual(['Event'])
    expect(Object.keys(document.components.pathItems)).toEqual(['Webhook', 'First', 'Second'])
  })

  it('follows discriminator names, escaped pointers and default mappings in 3.2', () => {
    const document = {
      ...api({ $ref: '#/components/schemas/Base' }),
      openapi: '3.2.0',
      components: {
        schemas: {
          Base: {
            discriminator: {
              propertyName: 'kind',
              mapping: { cat: 'Cat', slash: '#/components/schemas/A~1B~0' },
              defaultMapping: 'Other',
            },
          },
          Cat: { type: 'string' },
          'A/B~': { type: 'string' },
          Other: { type: 'string' },
          Dead: {},
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.schemas)).toEqual(['Base', 'Cat', 'A/B~', 'Other'])
  })

  it('keeps named dependencies in external documents without keeping stored siblings', () => {
    const document = {
      ...api({}),
      paths: { '/pets': { $ref: '#/x-ext/external/paths/~1pets' } },
      'x-ext': {
        external: {
          openapi: '3.1.0',
          info: { title: 'Stored API', version: '1' },
          paths: {
            '/pets': {
              get: {
                security: [{ local: [] }],
                responses: {
                  '200': {
                    description: 'OK',
                    content: { 'application/json': { schema: { $ref: '#/x-ext/external/components/schemas/Base' } } },
                  },
                },
              },
            },
          },
          components: {
            securitySchemes: { local: { type: 'http', scheme: 'basic' }, dead: { type: 'http', scheme: 'basic' } },
            schemas: {
              Base: { discriminator: { propertyName: 'kind', mapping: { cat: 'Cat' } } },
              Cat: { type: 'string' },
              Dead: { type: 'string' },
            },
          },
        },
        unused: { type: 'string' },
      },
    }
    prune(document)
    expect(Object.keys(document['x-ext'])).toEqual(['external'])
    expect(document['x-ext'].external.openapi).toBe('3.1.0')
    expect(document['x-ext'].external.info).toEqual({ title: 'Stored API', version: '1' })
    expect(Object.keys(document['x-ext'].external.components.securitySchemes)).toEqual(['local'])
    expect(Object.keys(document['x-ext'].external.components.schemas)).toEqual(['Base', 'Cat'])
  })

  it('resolves schema identities and anchors without reading literal data', () => {
    const literal = { $id: 'https://example.com/model', $anchor: 'root', $ref: '#/missing' }
    const document = {
      ...api({ $ref: 'https://example.com/model#root' }),
      'x-literal': literal,
      components: {
        schemas: {
          Model: {
            $id: 'https://example.com/model',
            $anchor: 'root',
            type: 'object',
            properties: { self: { $ref: '#root' } },
            example: literal,
            'x-literal': literal,
          },
          Dead: { type: 'string' },
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.schemas)).toEqual(['Model'])
    expect(document.components.schemas.Model.example).toBe(literal)
    expect(document['x-literal']).toBe(literal)
  })

  it('does not count references in examples or extensions as dependencies', () => {
    const document = {
      ...api({ type: 'string', example: { $ref: '#/components/schemas/Dead' }, 'x-data': { $ref: '#/missing' } }),
      components: { schemas: { Dead: {} } },
    }
    prune(document)
    expect(document.components.schemas).toEqual({})
  })

  it('retains all reusable content and warns when a reachable remote edge is unresolved', () => {
    const document = { ...api({ $ref: 'https://example.com/remote' }), components: { schemas: { A: {}, B: {} } } }
    const before = structuredClone(document)
    const result = checkDocument(document, { origin, prune: true, unresolvedReferences: 'retain' })
    expect(result).toMatchObject({
      ok: true,
      data: { warnings: [expect.stringContaining('Skipping'), expect.stringContaining('remote')] },
    })
    expect(document).toEqual(before)
  })

  it('does not retain dead remote edges and does not mutate on missing local targets', () => {
    const document = {
      ...api({ type: 'string' }),
      components: { schemas: { Remote: { $ref: 'https://example.com/remote' } } },
    }
    prune(document)
    expect(document.components.schemas).toEqual({})
    const missing = { ...api({ $ref: '#/missing' }), components: { schemas: { A: {} } } }
    const before = structuredClone(missing)
    expect(checkDocument(missing, { origin, prune: true, unresolvedReferences: 'retain' })).toMatchObject({ ok: false })
    expect(missing).toEqual(before)
  })

  it('retains root component siblings when a pointer targets one property', () => {
    const document = {
      ...api({ $ref: '#/components/schemas/Parent/properties/child' }),
      components: {
        schemas: {
          Parent: { properties: { child: { type: 'string' }, sibling: { $ref: '#/components/schemas/Sibling' } } },
          Sibling: { type: 'number' },
          Dead: {},
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.schemas)).toEqual(['Parent', 'Sibling'])
  })
  it('retains matching dynamic anchors conservatively', () => {
    const document = {
      ...api({ $ref: '#/components/schemas/Typed' }),
      components: {
        schemas: {
          Generic: {
            $id: 'https://example.com/generic',
            $dynamicAnchor: 'node',
            properties: { child: { $dynamicRef: '#node' } },
          },
          Typed: { $id: 'https://example.com/typed', $dynamicAnchor: 'node', $ref: 'https://example.com/generic' },
          Alternative: { $id: 'https://example.com/alternative', $dynamicAnchor: 'node', type: 'string' },
          Dead: {},
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.schemas)).toEqual(['Generic', 'Typed', 'Alternative'])
  })

  it('does not index identities in legacy OpenAPI schema data', () => {
    const document = {
      ...api({ $ref: '#/components/schemas/Used' }),
      openapi: '3.0.3',
      components: {
        schemas: {
          Used: { type: 'string', $id: 'https://example.com/literal', example: { $ref: '#/missing' } },
          Dead: {},
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.schemas)).toEqual(['Used'])
  })
  it('keeps literal dynamic anchors opaque', () => {
    const literal = { $dynamicAnchor: 'node', $ref: '#/missing' }
    const document = {
      ...api({ $ref: '#/components/schemas/Node' }),
      'x-example': literal,
      components: {
        schemas: {
          Node: {
            $id: 'https://example.com/node',
            $dynamicAnchor: 'node',
            properties: { child: { $dynamicRef: '#node' } },
            example: literal,
          },
          Dead: {},
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.schemas)).toEqual(['Node'])
    expect(document['x-example']).toBe(literal)
  })

  it('keeps dependencies of every retained external array element', () => {
    const document = {
      ...api({ $ref: '#/x-ext/chunk/array/0' }),
      'x-ext': {
        chunk: {
          array: [{ type: 'string' }, { $ref: '#/components/schemas/Dependency' }],
        },
      },
      components: { schemas: { Dependency: { type: 'number' }, Dead: {} } },
    }
    prune(document)
    expect(document['x-ext'].chunk.array).toHaveLength(2)
    expect(Object.keys(document.components.schemas)).toEqual(['Dependency'])
  })
  it('checks operationId links after exposing external Path Item fragments', () => {
    const document = {
      ...api({}),
      paths: {
        '/a': { $ref: '#/x-ext/item' },
        '/b': { get: { responses: { '200': { description: 'OK', links: { a: { operationId: 'getA' } } } } } },
      },
      'x-ext': { item: { get: { operationId: 'getA', responses: { '200': { description: 'OK' } } } } },
    }
    prune(document)
    expect(document['x-ext'].item.get.operationId).toBe('getA')
  })
  it('inherits the AsyncAPI schema format for stored payload wrappers', () => {
    const document = {
      asyncapi: '3.0.0',
      channels: { pets: { address: 'pets', messages: { pet: { payload: { $ref: '#/x-ext/schema' } } } } },
      operations: { send: { action: 'send', channel: { $ref: '#/channels/pets' } } },
      components: { schemas: { Foo: { type: 'string' }, Dead: {} } },
      'x-ext': {
        schema: {
          schemaFormat: 'application/schema+json;version=draft-07',
          schema: { $ref: '#/components/schemas/Foo' },
        },
      },
    }
    prune(document)
    expect(Object.keys(document.components.schemas)).toEqual(['Foo'])
  })

  it('inherits native AsyncAPI reference sibling semantics for stored payloads', () => {
    const document = {
      asyncapi: '2.6.0',
      channels: { pets: { publish: { message: { payload: { $ref: '#/x-ext/schema' } } } } },
      components: { schemas: { Foo: { type: 'string' } } },
      'x-ext': { schema: { $ref: '#/components/schemas/Foo', properties: { ignored: { $ref: '#/missing' } } } },
    }
    prune(document)
    expect(document.components.schemas.Foo).toEqual({ type: 'string' })
  })
})
