import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { isSchemaPath, upgradeFromThreeToThreeOne } from './upgrade-from-three-to-three-one'

describe('isSchemaPath', () => {
  it('correctly identifies schema paths', () => {
    expect(isSchemaPath(['components', 'schemas', 'User'])).toBe(true)
    expect(isSchemaPath(['paths', '/users', 'get', 'responses', '200', 'content', 'application/json', 'schema'])).toBe(
      true,
    )
    expect(isSchemaPath(['paths', '/users', 'post', 'requestBody', 'content', 'application/json', 'schema'])).toBe(true)
    expect(isSchemaPath(['components', 'schemas', 'User', 'properties', 'address'])).toBe(true)
    expect(isSchemaPath(['components', 'schemas', 'User', 'allOf', '0'])).toBe(true)
    expect(isSchemaPath(['paths', '/users', 'get', 'parameters', '0', 'schema'])).toBe(true)
  })

  it('correctly identifies non-schema paths', () => {
    expect(isSchemaPath(['info'])).toBe(false)
    expect(isSchemaPath(['paths', '/users', 'get', 'summary'])).toBe(false)
    expect(isSchemaPath(['components', 'parameters', 'userId'])).toBe(false)
  })
})

describe('upgradeFromThreeToThreeOne', () => {
  describe('version', () => {
    it(`doesn't modify Swagger 2.0 files`, async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        swagger: '2.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.swagger).toBe('2.0')
    })

    it('changes the version to from 3.0.0 to 3.1.1', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.1.1')
    })

    it('changes the version to 3.0.3 to 3.1.1', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.1.1')
    })
  })

  describe('nullable types', () => {
    it('migrates nullable types', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        type: ['string', 'null'],
      })
    })

    it('migrates nullable types with properties', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        nullable: true,
                        properties: {
                          name: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        nullable: true,
        properties: {
          name: {
            type: 'string',
          },
        },
      })
    })
  })

  describe('exclusiveMinimum and exclusiveMaximum', () => {
    it('migrate exclusiveMinimum and exclusiveMaximum', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'integer',
                        minimum: 1,
                        exclusiveMinimum: true,
                        maximum: 100,
                        exclusiveMaximum: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        type: 'integer',
        exclusiveMinimum: 1,
        exclusiveMaximum: 100,
      })
    })
  })

  describe('migrates example to examples', () => {
    it('uses arrays in schemas', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'integer',
                        example: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        type: 'integer',
        examples: [1],
      })
    })

    it('uses example objects everywhere else', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  schema: {
                    type: 'integer',
                    example: 10,
                  },
                  example: 10,
                },
              ],
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.parameters?.[0]).toEqual({
        name: 'limit',
        in: 'query',
        schema: {
          type: 'integer',
          // array, because it's in a schema
          examples: [10],
        },
        // object, because it's not in a schema
        examples: {
          default: {
            value: 10,
          },
        },
      })
    })

    it(`doesn't transform arrays into objects`, () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Sample API',
          version: '1.0.0',
          description: 'A simple example API',
        },
        tags: [
          {
            'name': 'users',
            'description': 'Operations about users',
            'x-internal': true,
          },
        ],
        paths: {
          '/users': {
            post: {
              tags: ['users'],
              summary: 'hello',
              description: 'Returns a list of users',
              operationId: 'getUsers',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        foobar: {
                          type: 'array',
                          example: ['Portfolio1', 'Portfolio2'],
                          items: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(
        result.paths?.['/users']?.post?.requestBody?.content['application/json'].schema.properties.foobar,
      ).toStrictEqual({
        type: 'array',
        examples: [['Portfolio1', 'Portfolio2']],
        items: {
          type: 'string',
        },
      })
    })
  })

  describe('describing File Upload Payloads', () => {
    it('removes schema for binary file uploads', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  'application/octet-stream': {
                    schema: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/upload']?.post?.requestBody?.content['application/octet-stream']).toEqual({})
    })

    it('migrates base64 format to contentEncoding for image uploads', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  'image/png': {
                    schema: {
                      type: 'string',
                      format: 'base64',
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/upload']?.post?.requestBody?.content['image/png']).toEqual({
        schema: {
          type: 'string',
          contentEncoding: 'base64',
        },
      })
    })

    it('migrates binary format for multipart file uploads', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      properties: {
                        orderId: {
                          type: 'integer',
                        },
                        fileName: {
                          type: 'string',
                          description: 'The file name',
                          format: 'binary',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/upload']?.post?.requestBody?.content['multipart/form-data']).toEqual({
        schema: {
          type: 'object',
          properties: {
            orderId: {
              type: 'integer',
            },
            fileName: {
              type: 'string',
              description: 'The file name',
              contentMediaType: 'application/octet-stream',
            },
          },
        },
      })
    })
  })

  it('migrates byte format', async () => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/upload': {
          post: {
            requestBody: {
              content: {
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'byte',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths?.['/upload']?.post?.requestBody?.content['image/png']).toEqual({
      schema: {
        type: 'string',
        contentMediaType: 'image/png',
        contentEncoding: 'base64',
      },
    })
  })

  describe.skip('declaring $schema', () => {
    it('adds a $schema', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.$schema).toBe('http://json-schema.org/draft-07/schema#')
    })
  })

  describe('binary format handling with oneOf', () => {
    it('correctly handles format: binary in oneOf schemas', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/images/edits': {
            post: {
              requestBody: {
                required: true,
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      required: ['model', 'prompt'],
                      properties: {
                        model: {
                          type: 'string',
                          enum: ['Kolors'],
                        },
                        image: {
                          oneOf: [
                            {
                              type: 'string',
                              format: 'binary',
                            },
                            {
                              type: 'string',
                            },
                          ],
                        },
                        prompt: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(
        result.paths?.['/images/edits']?.post?.requestBody?.content['multipart/form-data'].schema.properties.image
          .oneOf[0],
      ).toEqual({
        type: 'string',
        contentMediaType: 'application/octet-stream',
      })
    })
  })

  describe('webhooks', () => {
    it('correctly upgrades x-webhooks to webhooks', async () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        'x-webhooks': {
          'test': {
            post: {
              requestBody: {
                required: true,
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'string',
                      example: 'test',
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result['webhooks']).toEqual({
        'test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'string',
                    examples: ['test'],
                  },
                },
              },
            },
          },
        },
      })
    })
  })
})
