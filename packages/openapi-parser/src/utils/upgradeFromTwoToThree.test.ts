import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgradeFromTwoToThree'

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

    expect(result.openapi).toBe('3.0.3')
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
})
