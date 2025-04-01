import { describe, expect, it } from 'vitest'

import { OpenApiObjectSchema } from '../unprocessed/openapi-object'

describe('openapi-object', () => {
  describe('OpenApiObject', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#server-object-example
    describe('Server Object Example', () => {
      it(`The following shows how multiple servers can be described, for example, at the OpenAPI Object's servers`, () => {
        const result = OpenApiObjectSchema.parse({
          openapi: '3.1.1',
          info: {
            title: 'Example',
            version: '1.0.0',
          },
          servers: [
            {
              url: 'https://development.gigantic-server.com/v1',
              description: 'Development server',
            },
            {
              url: 'https://staging.gigantic-server.com/v1',
              description: 'Staging server',
            },
            {
              url: 'https://api.gigantic-server.com/v1',
              description: 'Production server',
            },
          ],
        })

        expect(result).toEqual({
          openapi: '3.1.1',
          info: {
            title: 'Example',
            version: '1.0.0',
          },
          servers: [
            {
              url: 'https://development.gigantic-server.com/v1',
              description: 'Development server',
            },
            {
              url: 'https://staging.gigantic-server.com/v1',
              description: 'Staging server',
            },
            {
              url: 'https://api.gigantic-server.com/v1',
              description: 'Production server',
            },
          ],
        })
      })
    })

    it('The following shows how variables can be used for a server configuration', () => {
      const result = OpenApiObjectSchema.parse({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        servers: [
          {
            'url': 'https://{username}.gigantic-server.com:{port}/{basePath}',
            'description': 'The production API server',
            'variables': {
              'username': {
                'default': 'demo',
                'description': 'A user-specific subdomain. Use `demo` for a free sandbox environment.',
              },
              port: {
                enum: ['8443', '443'],
                default: '8443',
              },
              'basePath': {
                'default': 'v2',
              },
            },
          },
        ],
      })

      expect(result).toEqual({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://{username}.gigantic-server.com:{port}/{basePath}',
            description: 'The production API server',
            variables: {
              username: {
                default: 'demo',
                description: 'A user-specific subdomain. Use `demo` for a free sandbox environment.',
              },
              port: {
                enum: ['8443', '443'],
                default: '8443',
              },
              basePath: {
                default: 'v2',
              },
            },
          },
        ],
      })
    })

    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#components-object-example
    it('Components Object Example', () => {
      const result = OpenApiObjectSchema.parse({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        components: {
          schemas: {
            GeneralError: {
              type: 'object',
              properties: {
                code: {
                  type: 'integer',
                  format: 'int32',
                },
                message: {
                  type: 'string',
                },
              },
            },
            Category: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                name: {
                  type: 'string',
                },
              },
            },
            Tag: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                name: {
                  type: 'string',
                },
              },
            },
          },
          parameters: {
            skipParam: {
              name: 'skip',
              in: 'query',
              description: 'number of items to skip',
              required: true,
              schema: {
                type: 'integer',
                format: 'int32',
              },
            },
            limitParam: {
              name: 'limit',
              in: 'query',
              description: 'max records to return',
              required: true,
              schema: {
                type: 'integer',
                format: 'int32',
              },
            },
          },
          responses: {
            NotFound: {
              description: 'Entity not found.',
            },
            IllegalInput: {
              description: 'Illegal input for operation.',
            },
            GeneralError: {
              description: 'General Error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GeneralError',
                  },
                },
              },
            },
          },
          securitySchemes: {
            api_key: {
              type: 'apiKey',
              name: 'api-key',
              in: 'header',
            },
            petstore_auth: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'https://example.org/api/oauth/dialog',
                  scopes: {
                    'write:pets': 'modify pets in your account',
                    'read:pets': 'read your pets',
                  },
                },
              },
            },
          },
        },
      })

      expect(result).toEqual({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        components: {
          schemas: {
            GeneralError: {
              type: 'object',
              properties: {
                code: {
                  type: 'integer',
                  format: 'int32',
                },
                message: {
                  type: 'string',
                },
              },
            },
            Category: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                name: {
                  type: 'string',
                },
              },
            },
            Tag: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                name: {
                  type: 'string',
                },
              },
            },
          },
          parameters: {
            skipParam: {
              name: 'skip',
              in: 'query',
              description: 'number of items to skip',
              required: true,
              schema: {
                type: 'integer',
                format: 'int32',
              },
            },
            limitParam: {
              name: 'limit',
              in: 'query',
              description: 'max records to return',
              required: true,
              schema: {
                type: 'integer',
                format: 'int32',
              },
            },
          },
          responses: {
            NotFound: {
              description: 'Entity not found.',
            },
            IllegalInput: {
              description: 'Illegal input for operation.',
            },
            GeneralError: {
              description: 'General Error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GeneralError',
                  },
                },
              },
            },
          },
          securitySchemes: {
            api_key: {
              type: 'apiKey',
              name: 'api-key',
              in: 'header',
            },
            petstore_auth: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'https://example.org/api/oauth/dialog',
                  scopes: {
                    'write:pets': 'modify pets in your account',
                    'read:pets': 'read your pets',
                  },
                },
              },
            },
          },
        },
      })
    })

    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#paths-object-example
    it('Paths Object Example', () => {
      const result = OpenApiObjectSchema.parse({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        paths: {
          '/pets': {
            get: {
              description: 'Returns all pets from the system that the user has access to',
              responses: {
                200: {
                  description: 'A list of pets.',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/pet',
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

      expect(result).toEqual({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        paths: {
          '/pets': {
            get: {
              description: 'Returns all pets from the system that the user has access to',
              responses: {
                200: {
                  description: 'A list of pets.',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/pet',
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
    })
  })
})
