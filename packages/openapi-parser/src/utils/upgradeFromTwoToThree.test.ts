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

  it('transforms paths', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      paths: {
        '/pets': {
          get: {
            description:
              'Returns all pets from the system that the user has access to',
            produces: ['application/json', 'application/xml'],
            responses: {
              '200': {
                description: 'A list of pets.',
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/pet',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/pets': {
        get: {
          description:
            'Returns all pets from the system that the user has access to',
          responses: {
            '200': {
              description: 'A list of pets.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/pet',
                    },
                  },
                },
                'application/xml': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/pet',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths['/pets'].get.produces).toBeUndefined()
  })

  it('uses global produces for responses', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json', 'application/xml'],
      paths: {
        '/pets': {
          get: {
            description:
              'Returns all pets from the system that the user has access to',
            responses: {
              '200': {
                description: 'A list of pets.',
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/pet',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/pets': {
        get: {
          description:
            'Returns all pets from the system that the user has access to',
          responses: {
            '200': {
              description: 'A list of pets.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/pet',
                    },
                  },
                },
                'application/xml': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/pet',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths['/pets'].get.produces).toBeUndefined()
  })
})
