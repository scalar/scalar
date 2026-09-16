import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from '../create-markdown-from-openapi'
import { attachRefValues } from './attach-ref-values'
import { parseOpenApiDocument } from './generated/openapidocument'

const makeDocument = (name: string): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title: name, version: '1' },
  paths: {
    '/test': {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Parent' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Parent: { type: 'object', properties: { child: { $ref: '#/components/schemas/Child' } } },
      Child: { type: 'object', properties: { name: { type: 'string', example: name } } },
    },
  },
})

describe('pipeline', () => {
  it('attaches shared cyclic targets without expanding serialized references', () => {
    const ref = { $ref: '#/components/schemas/Node' }
    const node = { type: 'object', properties: { next: ref } }
    const document = { components: { schemas: { Node: node } } }
    const serialized = JSON.stringify(document)
    attachRefValues(document)
    expect(Reflect.get(ref, '$ref-value')).toBe(node)
    expect(Object.keys(ref)).toEqual(['$ref'])
    expect(JSON.stringify(document)).toBe(serialized)
  })

  it('coerces metadata while keeping schema references and extension data intact', () => {
    const input: Record<string, unknown> = {
      ...makeDocument('Example'),
      info: { title: 123, version: 2 },
      'x-custom': { example: 'kept' },
    }
    const result = parseOpenApiDocument(input)
    expect(result.info.title).toBe('123')
    expect(result.info.version).toBe('2')
    expect(result['x-custom']).toEqual({ example: 'kept' })
    const schemas = (input.components as { schemas: Record<string, unknown> }).schemas
    expect(result.components?.schemas).toEqual(schemas)
    expect(result.components?.schemas?.Parent).toBe(schemas.Parent)
  })

  it('resolves nested references in response examples', async () => {
    const markdown = await createMarkdownFromOpenApi(makeDocument('Alice'), {
      operation: { path: '/test', method: 'get' },
    })
    const operation = markdown.split('## Schemas')[0]!
    expect(operation).toContain('```json\n{\n  "child": {\n    "name": "Alice"\n  }\n}\n```')
  })

  it('keeps concurrent document reference resolution independent', async () => {
    const [alice, bob] = await Promise.all([
      createMarkdownFromOpenApi(makeDocument('Alice')),
      createMarkdownFromOpenApi(makeDocument('Bob')),
    ])
    expect(alice).toContain('"name": "Alice"')
    expect(alice).not.toContain('Bob')
    expect(bob).toContain('"name": "Bob"')
    expect(bob).not.toContain('Alice')
  })
})
