import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { describe, expect, it, vi } from 'vitest'

import { createMarkdownFromOpenApi } from './create-markdown-from-openapi'
import { loadDocument } from './load-document'

// Record what TypeBox casts, since linked inputs make every clone copy the reference graph.
const coercedInputs = vi.hoisted((): unknown[] => [])
vi.mock('@scalar/workspace-store/schemas/typebox-coerce', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/workspace-store/schemas/typebox-coerce')>()
  return {
    ...actual,
    coerceValue: ((schema, value) => {
      coercedInputs.push(value)
      return actual.coerceValue(schema, value)
    }) satisfies typeof actual.coerceValue,
  }
})

const findReferences = (node: unknown, references: object[] = [], seen = new WeakSet<object>()): object[] => {
  if (node === null || typeof node !== 'object' || seen.has(node)) {
    return references
  }
  seen.add(node)

  if (isObject(node) && typeof node.$ref === 'string') {
    references.push(node)
  }
  for (const child of Object.values(node)) {
    findReferences(child, references, seen)
  }
  return references
}

const getReferenceTarget = (reference: object | undefined): unknown =>
  reference === undefined ? undefined : Object.getOwnPropertyDescriptor(reference, '$ref-value')?.value

/** Whether any object in the tree carries a `$ref-value` link, enumerable or not. */
const hasReferenceLinks = (node: unknown, seen = new WeakSet<object>()): boolean => {
  if (node === null || typeof node !== 'object' || seen.has(node)) {
    return false
  }
  seen.add(node)
  if (Object.hasOwn(node, '$ref-value')) {
    return true
  }
  return Object.values(node).some((child) => hasReferenceLinks(child, seen))
}

/**
 * Build a description shaped like Stripe's expandable fields: every model links to many
 * others, and the links cycle, so each model can reach almost every other model.
 */
const createDenselyLinkedDocument = (models: number, linksPerModel: number): Record<string, unknown> => {
  const name = (index: number): string => `Model${index % models}`
  const schemas: Record<string, unknown> = {}

  for (let index = 0; index < models; index++) {
    const properties: Record<string, unknown> = { id: { type: 'string' } }
    for (let link = 1; link <= linksPerModel; link++) {
      properties[`field${link}`] = {
        anyOf: [{ type: 'string' }, { $ref: `#/components/schemas/${name(index + link * 7 + 1)}` }],
      }
    }
    properties.list = { type: 'array', items: { $ref: `#/components/schemas/${name(index + 1)}` } }
    schemas[name(index)] = { type: 'object', properties }
  }

  return {
    openapi: '3.1.1',
    info: { title: 'Densely linked', version: '1' },
    paths: {
      '/models': {
        get: {
          responses: {
            '200': {
              description: 'OK',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Model0' } } },
            },
          },
        },
      },
    },
    components: { schemas },
  }
}

describe('load-document', () => {
  it.each([
    { type: 'object', xml: { wrapped: true }, properties: { id: { type: 'string' } } },
    { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } },
  ])('retains the source version and XML semantics when 3.2 conversion is incompatible', async (schema) => {
    const input = {
      openapi: '3.1.1',
      info: { title: 'XML API', version: '1' },
      paths: {
        '/items': { get: { responses: { '200': { description: 'OK', content: { 'application/xml': { schema } } } } } },
      },
    }
    const original = structuredClone(input)
    const result = await loadDocument(input)
    expect(result.openapi).toBe('3.1.1')
    expect(
      getValueAtPath(result, ['paths', '/items', 'get', 'responses', '200', 'content', 'application/xml', 'schema']),
    ).toStrictEqual(schema)
    expect(input).toStrictEqual(original)
  })

  it('retains optional discriminator semantics instead of inventing a default mapping', async () => {
    const schema = { type: 'object', discriminator: { propertyName: 'kind' }, properties: { kind: { type: 'string' } } }
    const result = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'API', version: '1' },
      paths: {},
      components: { schemas: { Pet: schema } },
    })
    expect(result.openapi).toBe('3.1.1')
    expect(result.components?.schemas?.Pet).toStrictEqual(schema)
  })

  it.each(['3.1.1', '3.2.0'])('still returns 3.2 for compatible %s input', async (openapi) => {
    const result = await loadDocument({ openapi, info: { title: 'API', version: '1' }, paths: {} })
    expect(result.openapi).toBe('3.2.0')
  })

  it('does not fall back after a clone safety failure', async () => {
    const input: Record<string, unknown> = { openapi: '3.1.1', info: { title: 'API', version: '1' }, paths: {} }
    input['x-cycle'] = input
    await expect(loadDocument(input)).rejects.toThrow('cyclic objects cannot be represented in JSON')
    expect(input['x-cycle']).toBe(input)
  })

  it('does not fall back after a malformed version error', async () => {
    await expect(loadDocument({ openapi: '3.1', info: { title: 'API', version: '1' }, paths: {} })).rejects.toThrow(
      'invalid OpenAPI version',
    )
  })

  it('keeps recursive local references shared and non-enumerable', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Recursive', version: '1' },
      paths: {
        '/nodes': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Node' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Node: {
            type: 'object',
            properties: {
              child: { $ref: '#/components/schemas/Node' },
            },
          },
        },
      },
    })

    const references = findReferences(document)
    const node = document.components?.schemas?.Node

    expect(references.length).toBe(2)
    expect(getReferenceTarget(references[0])).toBe(node)
    expect(getReferenceTarget(references[0])).toBe(getReferenceTarget(references[1]))
    expect(Object.getOwnPropertyDescriptor(references[0], '$ref-value')?.enumerable).toBe(false)
    expect(Object.getOwnPropertyDescriptor(references[1], '$ref-value')?.enumerable).toBe(false)
  })

  it('bundles external file references and links them to the coerced document', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'openapi-to-markdown-'))
    const schemasDirectory = join(directory, 'schemas')
    const documentPath = join(directory, 'openapi.yaml')
    const schemaPath = join(schemasDirectory, 'pet.yaml')

    await mkdir(schemasDirectory)
    await writeFile(
      documentPath,
      `openapi: 3.1.1
info:
  title: External reference
  version: '1'
paths:
  /pets:
    get:
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: ./schemas/pet.yaml#/Pet
`,
    )
    await writeFile(
      schemaPath,
      `Pet:
  type: object
  properties:
    id:
      type: string
`,
    )

    try {
      const document = await loadDocument(documentPath)
      const references = findReferences(document)
      const target = getReferenceTarget(references[0])

      expect(references.length).toBe(1)
      expect(Object.getOwnPropertyDescriptor(references[0], '$ref-value')?.enumerable).toBe(false)
      expect(isObject(target)).toBe(true)
      if (!isObject(target)) {
        return
      }
      expect(target.properties).toStrictEqual({ id: { type: 'string' } })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('bundles external URL references', async () => {
    const source = `openapi: 3.1.1
info:
  title: External URL reference
  version: '1'
paths:
  /pets:
    get:
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: ./pet.yaml#/Pet
`
    const schema = `Pet:
  type: object
  properties:
    name:
      type: string
`
    const server = createServer((request, response) => {
      if (request.url === '/openapi.yaml') {
        response.end(source)
        return
      }
      if (request.url === '/pet.yaml') {
        response.end(schema)
        return
      }
      response.statusCode = 404
      response.end()
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0

    try {
      const document = await loadDocument(`http://127.0.0.1:${port}/openapi.yaml`)
      const references = findReferences(document)
      const target = getReferenceTarget(references[0])

      expect(references.length).toBe(1)
      expect(Object.getOwnPropertyDescriptor(references[0], '$ref-value')?.enumerable).toBe(false)
      expect(isObject(target)).toBe(true)
      if (!isObject(target)) {
        return
      }
      expect(target.properties).toStrictEqual({ name: { type: 'string' } })
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })
  it('retains boolean schema references without changing example payloads or the input', async () => {
    const input = {
      openapi: '3.1.1',
      info: { title: 'Boolean references', version: '1' },
      components: {
        schemas: {
          Forbidden: false,
          Container: {
            type: 'object',
            properties: { forbidden: { $ref: '#/components/schemas/Forbidden' } },
            example: { schema: false, schemas: { value: true } },
          },
        },
      },
    }
    const original = JSON.stringify(input)
    const document = await loadDocument(input)
    expect(document.components?.schemas?.Forbidden).toBe(false)
    expect(getReferenceTarget(findReferences(document)[0])).toBe(false)
    const container = document.components?.schemas?.Container
    expect(container && 'example' in container ? container.example : undefined).toStrictEqual({
      schema: false,
      schemas: { value: true },
    })
    expect(JSON.stringify(input)).toBe(original)
  })

  it('keeps references whose targets fail strict schema checks', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Owners', version: '1' },
      paths: {
        '/app': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/App' } } },
              },
            },
            'x-github': { category: 'apps' },
          },
        },
      },
      components: {
        schemas: {
          App: {
            type: 'object',
            properties: {
              owner: { oneOf: [{ $ref: '#/components/schemas/User' }, { $ref: '#/components/schemas/Org' }] },
            },
          },
          User: { type: 'object', properties: { login: { type: 'string' } } },
          Org: { type: 'object', properties: { slug: { type: 'string' } } },
        },
      },
    })

    const operation = getValueAtPath(document, ['paths', '/app', 'get'])
    const schema = getValueAtPath(operation, ['responses', '200', 'content', 'application/json', 'schema'])

    expect(schema).toStrictEqual({ $ref: '#/components/schemas/App' })
    expect(getReferenceTarget(isObject(schema) ? schema : undefined)).toBe(document.components?.schemas?.App)
    expect(getValueAtPath(operation, ['x-github'])).toStrictEqual({ category: 'apps' })
  })

  it('links references to targets that coercion drops', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Legacy definitions', version: '1' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: '#/definitions/Pet' } } },
              },
            },
          },
        },
      },
      definitions: {
        Pet: { type: 'object', properties: { owner: { $ref: '#/components/schemas/Owner' } } },
      },
      components: { schemas: { Owner: { type: 'object', properties: { name: { type: 'string' } } } } },
    })

    const target = getReferenceTarget(findReferences(document)[0])
    const nested = getValueAtPath(target, ['properties', 'owner'])

    expect('definitions' in document).toBe(false)
    expect(target).toStrictEqual({ type: 'object', properties: { owner: { $ref: '#/components/schemas/Owner' } } })
    // The fallback target is outside the coerced tree, so its own references still point into it.
    expect(getReferenceTarget(isObject(nested) ? nested : undefined)).toBe(document.components?.schemas?.Owner)
  })

  it('casts dropped schema targets before linking them', async () => {
    const input = {
      openapi: '3.1.1',
      info: { title: 'Legacy definitions', version: '1' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        pet: { $ref: '#/definitions/Pet' },
                        anything: { $ref: '#/definitions/Anything' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      definitions: {
        Pet: { type: 'object', required: true, enum: 'cat', properties: { name: { type: 'string' } } },
        Anything: true,
      },
    }
    const document = await loadDocument(input)
    const [pet, anything] = findReferences(document).map(getReferenceTarget)

    expect(isObject(pet) && pet.required).not.toBe(true)
    expect(isObject(pet) && pet.enum).not.toBe('cat')
    expect(getValueAtPath(pet, ['properties', 'name'])).toStrictEqual({ type: 'string' })
    // OpenAPI 3.1 boolean schemas survive the cast, as they do everywhere else in the document.
    expect(anything).toBe(true)
    await expect(createMarkdownFromOpenApi(input)).resolves.toContain('name')
  })

  it('resolves references in dropped targets against the resource that contains them', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Resources', version: '1' },
      paths: {},
      components: {
        schemas: {
          A: {
            $id: 'https://example.com/a',
            type: 'object',
            properties: { pet: { $ref: 'https://example.com/b#/definitions/Pet' } },
          },
        },
      },
      // Coercion drops the root-level block, so every target in resource B is a fallback target.
      definitions: {
        B: {
          $id: 'https://example.com/b',
          definitions: {
            Pet: { type: 'object', properties: { owner: { $ref: '#owner' } } },
            Owner: { $anchor: 'owner', type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
    })

    const pet = getReferenceTarget(getValueAtPath(document, ['components', 'schemas', 'A', 'properties', 'pet']))
    const owner = getValueAtPath(pet, ['properties', 'owner'])

    // `#owner` names an anchor in resource B, not in resource A, where the reference came from.
    expect(getReferenceTarget(isObject(owner) ? owner : undefined)).toMatchObject({
      $anchor: 'owner',
      properties: { name: { type: 'string' } },
    })
  })

  it('links empty fragment references to the root of the current resource', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Linked list', version: '1' },
      paths: {},
      components: {
        schemas: {
          Node: { $id: 'https://example.com/node', type: 'object', properties: { next: { $ref: '#' } } },
        },
      },
    })

    const node = document.components?.schemas?.Node
    const next = getValueAtPath(node, ['properties', 'next'])

    expect(getReferenceTarget(isObject(next) ? next : undefined)).toBe(node)
  })

  it('loads densely linked descriptions without copying the reference graph', async () => {
    const models = 60
    const input = createDenselyLinkedDocument(models, 8)
    coercedInputs.length = 0

    const document = await loadDocument(input)

    // TypeBox clones follow every own property, so a linked input would copy the reference graph
    // at each checked union and array, which costs gigabytes on descriptions like Stripe's.
    expect(coercedInputs.length).toBeGreaterThan(0)
    for (const value of coercedInputs) {
      expect(hasReferenceLinks(value)).toBe(false)
    }

    const schemas = document.components?.schemas ?? {}
    const references = findReferences(document)
    expect(Object.keys(schemas)).toHaveLength(models)
    expect(references).toHaveLength(models * 9 + 1)
    for (const reference of references) {
      const target = getReferenceTarget(reference)
      expect(Object.values(schemas)).toContain(target)
      expect(Object.getOwnPropertyDescriptor(reference, '$ref-value')?.enumerable).toBe(false)
    }
  })
})
