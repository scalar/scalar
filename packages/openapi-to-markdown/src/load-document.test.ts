import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { describe, expect, it, vi } from 'vitest'

import { createMarkdownFromOpenApi, createOpenApiMarkdownRenderer } from './create-markdown-from-openapi'
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

const loadingDocument = { openapi: '3.1.1', info: { title: 'Trusted API', version: '1' }, paths: {} }
const externalDocument = (ref: string): Record<string, unknown> => ({
  ...loadingDocument,
  components: { schemas: { Secret: { $ref: ref } } },
})

describe('load-document', () => {
  it.each(['127.0.0.1', '[::1]', '169.254.169.254', '10.0.0.1'])(
    'blocks private URL inputs and references to %s',
    async (host) => {
      const url = `http://${host}/openapi.json`
      await expect(loadDocument(url)).rejects.toThrow('Failed to load OpenAPI document')
      await expect(loadDocument(externalDocument(url))).rejects.toThrow('Failed to resolve')
    },
  )

  it('requires an approved directory and confines initial and referenced files, including symlinks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'markdown-permissions-'))
    const approved = join(directory, 'approved')
    await mkdir(approved)
    const outside = join(directory, 'outside.json')
    const inside = join(approved, 'inside.json')
    const link = join(approved, 'link.json')
    try {
      await writeFile(outside, JSON.stringify(loadingDocument))
      await writeFile(inside, JSON.stringify(loadingDocument))
      await symlink(outside, link)
      await expect(loadDocument(inside)).rejects.toThrow('explicit basePath')
      await expect(loadDocument(externalDocument(inside))).rejects.toThrow('Failed to resolve')
      for (const path of [outside, join(approved, '../outside.json'), link]) {
        await expect(loadDocument(path, { basePath: approved })).rejects.toThrow('Failed to load')
        await expect(loadDocument(externalDocument(path), { basePath: approved })).rejects.toThrow('Failed to resolve')
      }
      const renderer = await createOpenApiMarkdownRenderer(inside, { basePath: approved })
      expect(await renderer.render()).toContain('Trusted API')
      expect(await createMarkdownFromOpenApi(inside, { documentLoading: { basePath: approved } })).toContain(
        'Trusted API',
      )
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('blocks loopback without contacting it and permits explicit trusted network access', async () => {
    const requests: string[] = []
    const server = createServer((request, response) => {
      requests.push(request.url ?? '')
      response.end(JSON.stringify(loadingDocument))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    try {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        throw new Error('Missing test server address')
      }
      const url = `http://127.0.0.1:${address.port}/openapi.json`
      await expect(createMarkdownFromOpenApi(url)).rejects.toThrow('Failed to load')
      expect(requests).toStrictEqual([])
      expect(await createMarkdownFromOpenApi(url, { documentLoading: { allowPrivateNetworks: true } })).toContain(
        'Trusted API',
      )
      expect(requests).toStrictEqual(['/openapi.json'])
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  })

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
      const document = await loadDocument(documentPath, { basePath: directory })
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

  it.each([
    { openapi: '3.2.1', identity: 'absolute', expected: 'Canonical pet schema.' },
    { openapi: '3.2.1', identity: 'relative', expected: 'Canonical pet schema.' },
    { openapi: '3.2.1', identity: 'absent', expected: 'Retrieval directory pet schema.' },
    { openapi: '3.1.2', identity: 'relative', expected: 'Retrieval directory pet schema.' },
  ])(
    'uses the correct reference base for OpenAPI $openapi with $identity identity',
    async ({ openapi, identity, expected }) => {
      const directory = await mkdtemp(join(tmpdir(), 'markdown-self-'))
      const documentPath = join(directory, 'openapi.json')
      const canonical = join(directory, 'canonical directory')
      const self =
        identity === 'absolute'
          ? pathToFileURL(join(canonical, 'openapi.json')).href
          : './canonical%20directory/openapi.json'

      try {
        await mkdir(canonical)
        for (const [location, description] of [
          [directory, 'Retrieval directory pet schema.'],
          [canonical, 'Canonical pet schema.'],
        ] as const) {
          const definitions = { components: { schemas: { Pet: { type: 'string', description } } } }
          await writeFile(join(location, 'defs.json'), JSON.stringify(definitions))
        }
        await writeFile(
          documentPath,
          JSON.stringify({
            ...loadingDocument,
            openapi,
            ...(identity === 'absent' ? {} : { $self: self }),
            components: { schemas: { Pet: { $ref: './defs.json#/components/schemas/Pet' } } },
          }),
        )

        const markdown = await createMarkdownFromOpenApi(documentPath, { documentLoading: { basePath: directory } })

        expect(markdown.match(/^(?:Canonical|Retrieval directory) pet schema\.$/gm)).toStrictEqual([expected])
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    },
  )

  it.each(['object', 'json', 'yaml'])('resolves a relative identity against basePath for %s input', async (format) => {
    const directory = await mkdtemp(join(tmpdir(), 'markdown-object-self-'))
    try {
      await mkdir(join(directory, 'canonical directory'))
      await writeFile(join(directory, 'pet.json'), JSON.stringify({ type: 'integer' }))
      await writeFile(join(directory, 'canonical directory', 'pet.json'), JSON.stringify({ type: 'string' }))
      const input = {
        ...loadingDocument,
        openapi: '3.2.1',
        $self: './canonical%20directory/openapi.json',
        components: { schemas: { Pet: { $ref: './pet.json' } } },
      }
      const serialized =
        format === 'yaml'
          ? `openapi: 3.2.1
$self: ./canonical%20directory/openapi.json
info: { title: Trusted API, version: '1' }
paths: {}
components:
  schemas:
    Pet:
      $ref: ./pet.json
`
          : JSON.stringify(input)
      const document = await loadDocument(format === 'object' ? input : serialized, { basePath: directory })

      expect(getReferenceTarget(document.components?.schemas?.Pet)).toStrictEqual({ type: 'string' })
      await expect(loadDocument(format === 'object' ? input : serialized)).rejects.toThrow('Failed to resolve')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('resolves references from the identity declared by a fetched OpenAPI document', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'markdown-external-self-'))
    const documentPath = join(directory, 'openapi.json')
    const canonical = join(directory, 'canonical')
    try {
      await mkdir(canonical)
      await writeFile(documentPath, JSON.stringify(externalDocument('./external.json#/components/schemas/Pet')))
      await writeFile(
        join(directory, 'external.json'),
        JSON.stringify({
          ...loadingDocument,
          openapi: '3.2.1',
          $self: './canonical/external.json',
          components: {
            schemas: { Pet: { type: 'object', properties: { name: { $ref: './defs.json#/Name' } } } },
          },
        }),
      )
      await writeFile(
        join(canonical, 'defs.json'),
        JSON.stringify({ Name: { type: 'string', description: 'Schema from the external document identity.' } }),
      )

      const markdown = await createMarkdownFromOpenApi(documentPath, { documentLoading: { basePath: directory } })

      expect(markdown).toContain('Schema from the external document identity.')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it.each([
    'https://example.com/api/openapi.json',
    'https://example.com:443/api/openapi.json',
    'file://localhost/example/api/openapi.json',
  ])('links relative references to the entry document identity %s from nested schema resources', async (self) => {
    const result = await loadDocument({
      ...loadingDocument,
      openapi: '3.2.1',
      $self: self,
      components: {
        schemas: {
          Pet: { type: 'string' },
          Model: { $id: 'model.json', properties: { pet: { $ref: './openapi.json#/components/schemas/Pet' } } },
        },
      },
    })

    const pet = result.components?.schemas?.Pet
    const reference = getValueAtPath(result, ['components', 'schemas', 'Model', 'properties', 'pet'])
    expect(pet).toStrictEqual({ type: 'string' })
    expect(getReferenceTarget(isObject(reference) ? reference : undefined)).toBe(pet)
  })

  it('preserves literal references in schema examples when the document declares an identity', async () => {
    const markdown = await createMarkdownFromOpenApi({
      ...loadingDocument,
      openapi: '3.2.1',
      $self: 'urn:example:pets',
      components: { schemas: { Pet: { type: 'object', examples: [{ $ref: '#literal-example' }] } } },
    })

    expect(markdown).toContain('"$ref": "#literal-example"')
  })

  it('follows nested references in multiple fragments of the same external file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'markdown-external-fragments-'))
    const documentPath = join(directory, 'openapi.json')
    try {
      await writeFile(
        documentPath,
        JSON.stringify({
          ...loadingDocument,
          openapi: '3.2.1',
          components: {
            schemas: {
              First: { $ref: './defs.json#/First' },
              Second: { $ref: './defs.json#/Second' },
            },
          },
        }),
      )
      await writeFile(
        join(directory, 'defs.json'),
        JSON.stringify({
          First: { type: 'object', properties: { first: { $ref: './types.json#/First' } } },
          Second: { type: 'object', properties: { second: { $ref: './types.json#/Second' } } },
        }),
      )
      await writeFile(
        join(directory, 'types.json'),
        JSON.stringify({
          First: { type: 'string', description: 'First fragment value.' },
          Second: { type: 'string', description: 'Second fragment value.' },
        }),
      )

      const markdown = await createMarkdownFromOpenApi(documentPath, { documentLoading: { basePath: directory } })

      expect(markdown).toContain('First fragment value.')
      expect(markdown).toContain('Second fragment value.')
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
      const document = await loadDocument(`http://127.0.0.1:${port}/openapi.yaml`, { allowPrivateNetworks: true })
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

    expect(pet).toStrictEqual({
      type: 'object',
      required: [],
      enum: [],
      properties: { name: { type: 'string' } },
    })
    // OpenAPI 3.1 boolean schemas survive the cast, as they do everywhere else in the document.
    expect(anything).toBe(true)
    await expect(createMarkdownFromOpenApi(input)).resolves.toContain('name')
  })

  it('casts dropped targets outside schemas as the objects they stand in for', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Custom root keys', version: '1' },
      paths: {
        '/items': {
          get: {
            parameters: [{ $ref: '#/legacy/Id' }, { $ref: '#/legacy/IdAlias' }],
            requestBody: { $ref: '#/legacy/Body' },
            responses: { '200': { $ref: '#/legacy/Ok' } },
            callbacks: { onEvent: { '{$request.body#/url}': { $ref: '#/legacy/Hook' } } },
          },
        },
      },
      // Coercion drops unknown root keys, so every target below is a fallback target.
      legacy: {
        Id: { name: 'id', in: 'query', required: 'yes', schema: true },
        IdAlias: { $ref: '#/legacy/Id', summary: 5, description: 'An identifier' },
        Body: {
          required: 'no',
          content: { 'application/json': { examples: { item: { $ref: '#/legacy/Item' } } } },
        },
        Ok: { description: 5, headers: { Limit: { $ref: '#/legacy/Limit' } } },
        Limit: { deprecated: 'soon', schema: { type: 'integer' } },
        Item: { summary: 1, value: { id: 1 } },
        Hook: { post: { responses: { '204': { description: 'Received' } } } },
      },
    })

    const operation = getValueAtPath(document, ['paths', '/items', 'get'])
    const target = (node: unknown, path: string[]): unknown => {
      const reference = getValueAtPath(node, path)
      return getReferenceTarget(isObject(reference) ? reference : undefined)
    }
    const body = target(operation, ['requestBody'])
    const response = target(operation, ['responses', '200'])

    // OpenAPI 3.1 boolean schemas survive inside the cast parameter.
    expect(target(operation, ['parameters', '0'])).toStrictEqual({
      name: 'id',
      in: 'query',
      required: false,
      schema: true,
    })
    const alias = target(operation, ['parameters', '1'])
    expect(alias).toStrictEqual({ $ref: '#/legacy/Id', description: 'An identifier' })
    expect(getReferenceTarget(isObject(alias) ? alias : undefined)).toBe(target(operation, ['parameters', '0']))
    expect(isObject(body) && body.required).toBe(false)
    expect(isObject(response) && response.description).toBe('')
    // References inside cast targets are linked and cast in their own positions.
    expect(target(response, ['headers', 'Limit'])).toStrictEqual({ deprecated: false, schema: { type: 'integer' } })
    expect(target(body, ['content', 'application/json', 'examples', 'item'])).toStrictEqual({
      summary: '',
      value: { id: 1 },
    })
    expect(target(operation, ['callbacks', 'onEvent', '{$request.body#/url}'])).toStrictEqual({
      post: { responses: { '204': { description: 'Received' } } },
    })
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
    expect(getReferenceTarget(isObject(owner) ? owner : undefined)).toStrictEqual({
      type: 'object',
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

  it.each(['definitions', 'x-models'])('casts schema targets stored in %s', async (key) => {
    const input = {
      openapi: '3.1.1',
      info: { title: 'Custom targets', version: '1' },
      paths: {},
      components: {
        schemas: {
          First: { $ref: `#/${key}/Pet` },
          Second: { $ref: `#/${key}/Pet` },
        },
      },
      [key]: { Pet: { type: 'object', required: true, properties: { name: { type: 'string' } } } },
    }
    const document = await loadDocument(input)
    const first = getReferenceTarget(document.components?.schemas?.First)
    const second = getReferenceTarget(document.components?.schemas?.Second)

    expect(first).toStrictEqual({ type: 'object', required: [], properties: { name: { type: 'string' } } })
    expect(second).toBe(first)
    await expect(createMarkdownFromOpenApi(input)).resolves.toContain('name')
  })

  it('casts schema siblings of fallback references while preserving their links', async () => {
    const input = {
      openapi: '3.1.1',
      info: { title: 'Reference siblings', version: '1' },
      paths: {},
      components: {
        schemas: {
          Root: { $ref: '#/definitions/Pet' },
          Base: { type: 'object', properties: { id: { type: 'integer' } } },
        },
      },
      definitions: {
        Pet: {
          $ref: '#/components/schemas/Base',
          type: 'object',
          required: true,
          properties: { name: { type: 'string' }, child: { $ref: '#/definitions/Pet' } },
        },
      },
    }
    const document = await loadDocument(input)
    const pet = getReferenceTarget(document.components?.schemas?.Root)
    expect(pet).toStrictEqual({
      $ref: '#/components/schemas/Base',
      type: 'object',
      required: [],
      properties: { name: { type: 'string' }, child: { $ref: '#/definitions/Pet' } },
    })
    expect(getReferenceTarget(isObject(pet) ? pet : undefined)).toBe(document.components?.schemas?.Base)
    expect(getReferenceTarget(getValueAtPath(pet, ['properties', 'child']))).toBe(pet)
    await expect(createMarkdownFromOpenApi(input)).resolves.toContain('name')
  })

  it('preserves operation siblings on fallback path item references', async () => {
    const document = await loadDocument({
      openapi: '3.2.0',
      info: { title: 'Path items', version: '1' },
      paths: { '/items': { $ref: '#/legacy/Path' } },
      legacy: {
        Path: {
          $ref: '#/components/pathItems/Base',
          connect: { responses: { '200': { $ref: '#/legacy/Response' } } },
        },
        Response: { description: 5 },
      },
      components: { pathItems: { Base: { get: { responses: { '204': { description: 'Done' } } } } } },
    })
    const path = getReferenceTarget(getValueAtPath(document, ['paths', '/items']))
    expect(path).toStrictEqual({
      $ref: '#/components/pathItems/Base',
      connect: { responses: { '200': { $ref: '#/legacy/Response' } } },
    })
    expect(getReferenceTarget(isObject(path) ? path : undefined)).toBe(document.components?.pathItems?.Base)
    expect(getReferenceTarget(getValueAtPath(path, ['connect', 'responses', '200']))).toStrictEqual({ description: '' })
  })

  it('casts fallback references inside contentSchema and restores boolean schemas', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Encoded content', version: '1' },
      paths: {},
      components: {
        schemas: {
          Encoded: {
            type: 'string',
            contentMediaType: 'application/json',
            contentSchema: { $ref: '#/definitions/Pet' },
          },
          Anything: { type: 'string', contentSchema: true },
        },
      },
      definitions: { Pet: { type: 'object', required: true, properties: { name: { type: 'string' } } } },
    })
    expect(
      getReferenceTarget(getValueAtPath(document, ['components', 'schemas', 'Encoded', 'contentSchema'])),
    ).toStrictEqual({
      type: 'object',
      required: [],
      properties: { name: { type: 'string' } },
    })
    expect(getValueAtPath(document, ['components', 'schemas', 'Anything', 'contentSchema'])).toBe(true)
  })

  it.each(['default', 'example', 'examples', 'const', 'enum', 'schema', 'schemas', 'itemSchema'])(
    'links references inside OpenAPI objects named %s',
    async (name) => {
      const header = (): object => ({ schema: { $ref: '#/components/schemas/Error' } })
      const content = (): object => ({ 'application/json': header() })
      const document = await loadDocument({
        openapi: '3.1.1',
        info: { title: 'Names', version: '1' },
        paths: {
          '/pets': {
            get: {
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: { type: 'object' },
                    encoding: { [name]: { headers: { [name]: header() } } },
                  },
                },
              },
              responses: { [name]: { description: 'Error', content: content(), headers: { [name]: header() } } },
              callbacks: { [name]: { [name]: { post: { requestBody: { content: content() } } } } },
            },
          },
        },
        webhooks: { [name]: { post: { requestBody: { content: content() } } } },
        components: {
          schemas: { Error: { type: 'object', properties: { code: { type: 'integer' } } } },
          responses: { [name]: { description: 'Error', content: content() } },
          requestBodies: { [name]: { content: content() } },
          headers: { [name]: header() },
          callbacks: { [name]: { [name]: { post: { requestBody: { content: content() } } } } },
          pathItems: { [name]: { post: { requestBody: { content: content() } } } },
        },
      })

      const references = findReferences(document)
      expect(references).toHaveLength(10)
      for (const reference of references) {
        expect(getReferenceTarget(reference)).toBe(document.components?.schemas?.Error)
      }
    },
  )

  it('resolves pointers into a default response as schemas', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Pointers', version: '1' },
      paths: {
        '/pets': {
          get: {
            responses: {
              default: {
                description: 'Error',
                content: { 'application/json': { schema: { type: 'object', required: true } } },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Error: { $ref: '#/paths/~1pets/get/responses/default/content/application~1json/schema' },
        },
      },
    })

    expect(getReferenceTarget(document.components?.schemas?.Error)).toStrictEqual({ type: 'object', required: [] })
  })

  it('restores boolean schemas inside a default response', async () => {
    const input = {
      openapi: '3.1.1',
      info: { title: 'Boolean default response', version: '1' },
      paths: {
        '/pets': {
          get: {
            responses: {
              default: {
                description: 'Error',
                content: { 'application/json': { schema: { type: 'object', properties: { detail: false } } } },
                headers: { 'X-Trace': { schema: true } },
              },
            },
          },
        },
      },
    }
    const original = structuredClone(input)

    const document = await loadDocument(input)

    const response = getValueAtPath(document, ['paths', '/pets', 'get', 'responses', 'default'])
    expect(getValueAtPath(response, ['content', 'application/json', 'schema', 'properties', 'detail'])).toBe(false)
    expect(getValueAtPath(response, ['headers', 'X-Trace', 'schema'])).toBe(true)
    expect(input).toStrictEqual(original)
  })

  it('keeps default and example keyword values as data', async () => {
    const data = { $ref: '#/components/schemas/Error', flag: false }
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Keyword data', version: '1' },
      paths: {
        '/pets': {
          get: {
            responses: {
              default: {
                description: 'Error',
                content: {
                  'application/json': {
                    schema: { type: 'object', default: data },
                    examples: { default: { value: data } },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { Error: { type: 'object' } } },
    })

    const media = getValueAtPath(document, [
      'paths',
      '/pets',
      'get',
      'responses',
      'default',
      'content',
      'application/json',
    ])
    expect(hasReferenceLinks(media)).toBe(false)
    expect(getValueAtPath(media, ['schema', 'default'])).toStrictEqual(data)
    expect(getValueAtPath(media, ['examples', 'default', 'value'])).toStrictEqual(data)
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
