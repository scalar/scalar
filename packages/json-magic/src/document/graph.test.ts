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
})
