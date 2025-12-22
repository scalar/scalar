import { describe, expect, it } from 'vitest'

import { pruneDocument } from './prune-document'

describe('pruneDocument', () => {
  it('removes undefined values from top-level document properties', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
      tags: undefined,
      security: undefined,
      components: undefined,
      externalDocs: undefined,
    }

    const result = pruneDocument(document as any)

    expect(result.tags).toBeUndefined()
    expect(result.security).toBeUndefined()
    expect(result.components).toBeUndefined()
    expect(result.externalDocs).toBeUndefined()
    expect('tags' in result).toBe(false)
    expect('security' in result).toBe(false)
    expect('components' in result).toBe(false)
    expect('externalDocs' in result).toBe(false)
  })

  it('removes undefined values from nested operations', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test operation',
            tags: undefined,
            responses: undefined,
            parameters: undefined,
            requestBody: undefined,
            security: undefined,
            servers: undefined,
          },
        },
      },
    }

    const result = pruneDocument(document as any)
    const operation = result.paths?.['/test']?.get

    expect(operation).toBeDefined()
    expect(operation?.summary).toBe('Test operation')
    expect(operation?.tags).toBeUndefined()
    expect(operation?.responses).toBeUndefined()
    expect(operation?.parameters).toBeUndefined()
    expect(operation?.requestBody).toBeUndefined()
    expect(operation?.security).toBeUndefined()
    expect(operation?.servers).toBeUndefined()
    expect('tags' in operation!).toBe(false)
    expect('responses' in operation!).toBe(false)
    expect('parameters' in operation!).toBe(false)
    expect('requestBody' in operation!).toBe(false)
    expect('security' in operation!).toBe(false)
    expect('servers' in operation!).toBe(false)
  })

  it('removes undefined values from path items', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          summary: undefined,
          description: undefined,
          servers: undefined,
          parameters: undefined,
          get: {
            summary: 'Test',
          },
        },
      },
    }

    const result = pruneDocument(document as any)
    const pathItem = result.paths?.['/test']

    expect(pathItem).toBeDefined()
    expect(pathItem?.summary).toBeUndefined()
    expect(pathItem?.description).toBeUndefined()
    expect(pathItem?.servers).toBeUndefined()
    expect(pathItem?.parameters).toBeUndefined()
    expect('summary' in pathItem!).toBe(false)
    expect('description' in pathItem!).toBe(false)
    expect('servers' in pathItem!).toBe(false)
    expect('parameters' in pathItem!).toBe(false)
  })

  it('removes undefined values from request bodies and responses', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          post: {
            summary: 'Test',
            requestBody: {
              description: undefined,
              required: undefined,
              content: {
                'application/json': {
                  schema: { type: 'object' },
                  examples: undefined,
                  encoding: undefined,
                },
              },
            },
            responses: {
              '200': {
                description: 'Success',
                headers: undefined,
                content: undefined,
                links: undefined,
              },
            },
          },
        },
      },
    }

    const result = pruneDocument(document as any)
    const operation = result.paths?.['/test']?.post
    const requestBody = operation?.requestBody
    const response = operation?.responses?.['200']

    expect(requestBody).toBeDefined()
    expect(requestBody?.description).toBeUndefined()
    expect(requestBody?.required).toBeUndefined()
    expect('description' in requestBody!).toBe(false)
    expect('required' in requestBody!).toBe(false)

    expect(requestBody?.content?.['application/json']?.examples).toBeUndefined()
    expect(requestBody?.content?.['application/json']?.encoding).toBeUndefined()
    expect('examples' in requestBody!.content!['application/json']!).toBe(false)
    expect('encoding' in requestBody!.content!['application/json']!).toBe(false)

    expect(response).toBeDefined()
    expect(response?.headers).toBeUndefined()
    expect(response?.content).toBeUndefined()
    expect(response?.links).toBeUndefined()
    expect('headers' in response!).toBe(false)
    expect('content' in response!).toBe(false)
    expect('links' in response!).toBe(false)
  })

  it('preserves null values', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test',
            description: null,
            responses: {
              '200': {
                description: null,
              },
            },
          },
        },
      },
    }

    const result = pruneDocument(document as any)
    const operation = result.paths?.['/test']?.get
    const response = operation?.responses?.['200']

    expect(operation?.description).toBeNull()
    expect(response?.description).toBeNull()
  })

  it('handles empty arrays and objects correctly', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
      tags: [],
      security: [],
      components: {},
    }

    const result = pruneDocument(document as any)

    // Empty arrays and objects should be removed by the existing logic
    expect(result.tags).toBeUndefined()
    expect(result.security).toBeUndefined()
    expect(result.components).toBeUndefined()
  })

  it('removes undefined values from deeply nested structures', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          post: {
            summary: 'Test',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: undefined,
                        description: undefined,
                      },
                    },
                    required: undefined,
                  },
                  examples: {
                    example1: {
                      summary: undefined,
                      description: undefined,
                      value: { name: 'test' },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      example: undefined,
                    },
                    examples: undefined,
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = pruneDocument(document as any)
    const operation = result.paths?.['/test']?.post
    const schema = operation?.requestBody?.content?.['application/json']?.schema as any
    const example = operation?.requestBody?.content?.['application/json']?.examples?.example1 as any
    const responseSchema = operation?.responses?.['200']?.content?.['application/json']?.schema as any

    expect(schema.properties.name.example).toBeUndefined()
    expect(schema.properties.name.description).toBeUndefined()
    expect('example' in schema.properties.name).toBe(false)
    expect('description' in schema.properties.name).toBe(false)

    expect(schema.required).toBeUndefined()
    expect('required' in schema).toBe(false)

    expect(example.summary).toBeUndefined()
    expect(example.description).toBeUndefined()
    expect('summary' in example).toBe(false)
    expect('description' in example).toBe(false)

    expect(responseSchema.example).toBeUndefined()
    expect('example' in responseSchema).toBe(false)

    expect(operation?.responses?.['200']?.content?.['application/json']?.examples).toBeUndefined()
    expect('examples' in operation!.responses!['200']!.content!['application/json']!).toBe(false)
  })

  it('removes undefined values from arrays', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test',
            parameters: [
              {
                name: 'param1',
                in: 'query',
                description: 'Param 1',
              },
              {
                name: 'param2',
                in: 'query',
                description: undefined,
                example: undefined,
              },
            ],
            tags: ['tag1', undefined, 'tag2'] as any,
          },
        },
      },
    }

    const result = pruneDocument(document as any)
    const operation = result.paths?.['/test']?.get

    expect(operation?.parameters).toHaveLength(2)
    expect(operation?.parameters?.[1]?.description).toBeUndefined()
    expect(operation?.parameters?.[1]?.example).toBeUndefined()
    expect('description' in operation!.parameters![1]!).toBe(false)
    expect('example' in operation!.parameters![1]!).toBe(false)

    // Arrays with undefined values should have them filtered out
    expect(operation?.tags).toEqual(['tag1', 'tag2'])
  })

  it('handles complex real-world scenario with multiple undefined values', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: undefined,
        contact: undefined,
        license: undefined,
      },
      servers: undefined,
      paths: {
        '/users': {
          summary: undefined,
          get: {
            operationId: undefined,
            summary: 'Get users',
            description: undefined,
            tags: undefined,
            parameters: undefined,
            requestBody: undefined,
            responses: {
              '200': {
                description: 'Success',
                headers: undefined,
                content: undefined,
              },
            },
            security: undefined,
            servers: undefined,
          },
        },
      },
      components: {
        schemas: undefined,
        responses: undefined,
        parameters: undefined,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
      security: undefined,
      tags: undefined,
      externalDocs: undefined,
    }

    const result = pruneDocument(document as any)

    // Top level
    expect(result.info).toBeDefined()
    expect(result.info?.description).toBeUndefined()
    expect(result.info?.contact).toBeUndefined()
    expect(result.info?.license).toBeUndefined()
    expect('description' in result.info!).toBe(false)
    expect('contact' in result.info!).toBe(false)
    expect('license' in result.info!).toBe(false)
    expect(result.servers).toBeUndefined()
    expect('servers' in result).toBe(false)

    // Path item
    const pathItem = result.paths?.['/users']
    expect(pathItem?.summary).toBeUndefined()
    expect('summary' in pathItem!).toBe(false)

    // Operation
    const operation = pathItem?.get
    expect(operation?.operationId).toBeUndefined()
    expect(operation?.description).toBeUndefined()
    expect(operation?.tags).toBeUndefined()
    expect(operation?.parameters).toBeUndefined()
    expect(operation?.requestBody).toBeUndefined()
    expect(operation?.security).toBeUndefined()
    expect(operation?.servers).toBeUndefined()
    expect('operationId' in operation!).toBe(false)
    expect('description' in operation!).toBe(false)
    expect('tags' in operation!).toBe(false)
    expect('parameters' in operation!).toBe(false)
    expect('requestBody' in operation!).toBe(false)
    expect('security' in operation!).toBe(false)
    expect('servers' in operation!).toBe(false)

    // Response
    const response = operation?.responses?.['200']
    expect(response?.headers).toBeUndefined()
    expect(response?.content).toBeUndefined()
    expect('headers' in response!).toBe(false)
    expect('content' in response!).toBe(false)

    // Components
    expect(result.components?.schemas).toBeUndefined()
    expect(result.components?.responses).toBeUndefined()
    expect(result.components?.parameters).toBeUndefined()
    expect('schemas' in result.components!).toBe(false)
    expect('responses' in result.components!).toBe(false)
    expect('parameters' in result.components!).toBe(false)
    expect(result.components?.securitySchemes).toBeDefined()
  })
})
