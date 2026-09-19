import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { describe, expect, it } from 'vitest'

import { loadDocument } from './load-document'

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
})
