import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgradeFromTwoToThree.ts'

describe('upgradeFromTwoToThree', () => {
  it('changes the version to from 3.0.0 to 3.1.0', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(result.openapi).toBe('3.0.4')
    expect(result.swagger).toBeUndefined()
  })

  it('upgrades URLs to new server syntax', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      basePath: '/v1',
      schemes: ['http'],
      host: 'api.example.com',
    })

    expect(result.servers).toStrictEqual([
      {
        url: 'http://api.example.com/v1',
      },
    ])

    expect(result.basePath).toBeUndefined()
    expect(result.schemes).toBeUndefined()
    expect(result.host).toBeUndefined()
  })

  it('upgrades host to new server syntax', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      host: 'api.example.com',
    })

    expect(result.servers).toStrictEqual([
      {
        url: 'http://api.example.com',
      },
    ])

    expect(result.basePath).toBeUndefined()
    expect(result.schemes).toBeUndefined()
    expect(result.host).toBeUndefined()
  })

  it('moves definitions to components', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      definitions: {
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
          },
        },
      },
    })

    // @ts-expect-error it’s fine
    expect(result.components?.schemas).toStrictEqual({
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
        },
      },
    })

    expect(result.definitions).toBeUndefined()
  })

  it('rewrites $refs to definitions', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      paths: {
        '/planets': {
          get: {
            responses: {
              '200': {
                schema: {
                  $ref: '#/definitions/Planet',
                },
              },
            },
          },
        },
      },
      definitions: {
        Planet: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    })
    expect(
      result.paths['/planets'].get.responses['200'].content['application/json']
        .schema.$ref,
    ).toBe('#/components/schemas/Planet')
  })

  it('transforms responses', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      paths: {
        '/planets': {
          get: {
            description:
              'Returns all planets from the system that the user has access to',
            produces: ['application/json', 'application/xml'],
            responses: {
              '200': {
                description: 'A list of planets.',
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/planet',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/planets': {
        get: {
          description:
            'Returns all planets from the system that the user has access to',
          responses: {
            '200': {
              description: 'A list of planets.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/planet',
                    },
                  },
                },
                'application/xml': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/planet',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths['/planets'].get.produces).toBeUndefined()
  })

  it('uses global produces for responses', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json', 'application/xml'],
      paths: {
        '/planets': {
          get: {
            description:
              'Returns all planets from the system that the user has access to',
            responses: {
              '200': {
                description: 'A list of planets.',
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/Planet',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/planets': {
        get: {
          description:
            'Returns all planets from the system that the user has access to',
          responses: {
            '200': {
              description: 'A list of planets.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/Planet',
                    },
                  },
                },
                'application/xml': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/Planet',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths['/planets'].get.produces).toBeUndefined()
  })

  it('transforms requestBody', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',

      paths: {
        '/planets': {
          get: {
            description:
              'Returns all planets from the system that the user has access to',
            consumes: ['application/json', 'application/xml'],
            parameters: [
              {
                in: 'body',
                name: 'body',
                description:
                  'Planet object that needs to be added to the store',
                required: true,
                schema: {
                  $ref: '#/definitions/Planet',
                },
              },
            ],
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/planets': {
        get: {
          description:
            'Returns all planets from the system that the user has access to',
          requestBody: {
            description: 'Planet object that needs to be added to the store',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/definitions/Planet',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/definitions/Planet',
                },
              },
            },
            required: true,
          },
        },
      },
    })

    expect(result.paths['/planets'].get.produces).toBeUndefined()
  })

  it('uses global consumes for requestBody', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json', 'application/xml'],
      paths: {
        '/planets': {
          get: {
            description:
              'Returns all planets from the system that the user has access to',
            consumes: ['application/json', 'application/xml'],
            parameters: [
              {
                in: 'body',
                name: 'body',
                description:
                  'Planet object that needs to be added to the store',
                required: true,
                schema: {
                  $ref: '#/definitions/Planet',
                },
              },
            ],
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/planets': {
        get: {
          description:
            'Returns all planets from the system that the user has access to',
          requestBody: {
            description: 'Planet object that needs to be added to the store',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/definitions/Planet',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/definitions/Planet',
                },
              },
            },
            required: true,
          },
        },
      },
    })

    expect(result.paths['/planets'].get.produces).toBeUndefined()
  })

  it('migrates formData', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      paths: {
        '/planets': {
          get: {
            description:
              'Returns all planets from the system that the user has access to',
            parameters: [
              {
                name: 'additionalMetadata',
                in: 'formData',
                description: 'Additional data to pass to server',
                required: true,
                type: 'string',
              },
            ],
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/planets': {
        get: {
          description:
            'Returns all planets from the system that the user has access to',
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  required: ['additionalMetadata'],
                  properties: {
                    additionalMetadata: {
                      description: 'Additional data to pass to server',
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths['/planets'].get.produces).toBeUndefined()
  })

  it('upgrades securityDefinitions from Swagger 2.0 to OpenAPI 3.0', () => {
    const input = {
      swagger: '2.0',
      securityDefinitions: {
        api_key: {
          type: 'apiKey',
          name: 'api_key',
          in: 'header',
        },
        petstore_auth: {
          type: 'oauth2',
          authorizationUrl: 'https://petstore.swagger.io/oauth/authorize',
          flow: 'implicit',
          scopes: {
            'read:pets': 'read your pets',
            'write:pets': 'modify pets in your account',
          },
        },
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            security: [
              {
                petstore_auth: ['read:pets'],
              },
            ],
          },
        },
      },
    }

    const result = upgradeFromTwoToThree(input)

    // @ts-expect-error it’s fine
    expect(result.components.securitySchemes).toStrictEqual({
      api_key: {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      },
      petstore_auth: {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://petstore.swagger.io/oauth/authorize',
            scopes: {
              'read:pets': 'read your pets',
              'write:pets': 'modify pets in your account',
            },
          },
        },
      },
    })

    expect(result.securityDefinitions).toBeUndefined()

    // Check if the security attribute in the operation is upgraded
    expect(result.paths['/pets'].get.security).toStrictEqual([
      {
        petstore_auth: ['read:pets'],
      },
    ])
  })
})
