import type { OpenAPIV3 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgrade-from-two-to-three'

describe('upgradeFromTwoToThree', () => {
  it('changes the version to from 3.0.0 to 3.1.0', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
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
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
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

  it('upgrades basePath to new server syntax', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      basePath: '/v2',
    })

    expect(result.servers).toStrictEqual([
      {
        url: '/v2',
      },
    ])

    expect(result.basePath).toBeUndefined()
    expect(result.schemes).toBeUndefined()
    expect(result.host).toBeUndefined()
  })

  it('upgrades host to new server syntax', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
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
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
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
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
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
    expect(result.paths?.['/planets']?.get?.responses?.['200']?.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/Planet',
    )
  })

  it('transforms responses', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      paths: {
        '/planets': {
          get: {
            description: 'Returns all planets from the system that the user has access to',
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
          description: 'Returns all planets from the system that the user has access to',
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

    expect(result.paths?.['/planets']?.get?.produces).toBeUndefined()
  })

  it('uses global produces for responses', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json', 'application/xml'],
      paths: {
        '/planets': {
          get: {
            description: 'Returns all planets from the system that the user has access to',
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
          description: 'Returns all planets from the system that the user has access to',
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

    expect(result.paths?.['/planets']?.get?.produces).toBeUndefined()
  })

  it('transforms requestBody', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',

      paths: {
        '/planets': {
          get: {
            description: 'Returns all planets from the system that the user has access to',
            consumes: ['application/json', 'application/xml'],
            parameters: [
              {
                in: 'body',
                name: 'body',
                description: 'Planet object that needs to be added to the store',
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
          description: 'Returns all planets from the system that the user has access to',
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

    expect(result.paths?.['/planets']?.get?.produces).toBeUndefined()
  })

  it('uses global consumes for requestBody', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json', 'application/xml'],
      paths: {
        '/planets': {
          get: {
            description: 'Returns all planets from the system that the user has access to',
            consumes: ['application/json', 'application/xml'],
            parameters: [
              {
                in: 'body',
                name: 'body',
                description: 'Planet object that needs to be added to the store',
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
          description: 'Returns all planets from the system that the user has access to',
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

    expect(result.paths?.['/planets']?.get?.produces).toBeUndefined()
  })

  it('migrates formData', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      paths: {
        '/planets': {
          get: {
            description: 'Returns all planets from the system that the user has access to',
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
          description: 'Returns all planets from the system that the user has access to',
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

    expect(result.paths?.['/planets']?.get?.produces).toBeUndefined()
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
        petstore_application: {
          type: 'oauth2',
          flow: 'application',
          tokenUrl: 'https://petstore.swagger.io/oauth/token',
          scopes: {
            'read:pets': 'read your pets',
            'write:pets': 'modify pets in your account',
          },
        },
        petstore_access_code: {
          type: 'oauth2',
          flow: 'accessCode',
          authorizationUrl: 'https://petstore.swagger.io/oauth/authorize',
          tokenUrl: 'https://petstore.swagger.io/oauth/token',
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

    const result: OpenAPIV3.Document = upgradeFromTwoToThree(input)

    expect(result.components?.securitySchemes).toStrictEqual({
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
      petstore_application: {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://petstore.swagger.io/oauth/token',
            scopes: {
              'read:pets': 'read your pets',
              'write:pets': 'modify pets in your account',
            },
          },
        },
      },
      petstore_access_code: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://petstore.swagger.io/oauth/authorize',
            tokenUrl: 'https://petstore.swagger.io/oauth/token',
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
    expect(result.paths?.['/pets']?.get?.security).toStrictEqual([
      {
        petstore_auth: ['read:pets'],
      },
    ])
  })

  it('transforms parameter schemas', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json', 'application/xml'],
      paths: {
        '/planets': {
          get: {
            description: 'Returns all planets from the system that the user has access to',
            consumes: ['application/json', 'application/xml'],
            parameters: [
              {
                in: 'header',
                name: 'x-custom-header',
                required: true,
                type: 'string',
                format: 'date-time',
                allowEmptyValue: true,
              },
              {
                in: 'query',
                name: 'size',
                required: false,
                type: 'integer',
                multipleOf: 2,
                minimum: 1,
                maximum: 100,
              },
            ],
          },
        },
      },
    })

    expect(result.paths?.['/planets']?.get?.parameters).toHaveLength(2)
    expect(result.paths?.['/planets']?.get?.parameters?.[0]).toStrictEqual({
      in: 'header',
      name: 'x-custom-header',
      required: true,
      allowEmptyValue: true,
      schema: {
        type: 'string',
        format: 'date-time',
      },
    })
    expect(result.paths?.['/planets']?.get?.parameters?.[1]).toStrictEqual({
      in: 'query',
      name: 'size',
      required: false,
      schema: {
        type: 'integer',
        multipleOf: 2,
        minimum: 1,
        maximum: 100,
      },
    })
  })

  it('transforms basic security scheme', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      paths: {},
      securityDefinitions: {
        basic_auth: {
          type: 'basic',
          name: 'basic_auth',
          in: 'header',
        },
      },
    })

    // @ts-expect-error it's fine
    expect(result.components?.securitySchemes.basic_auth).toStrictEqual({
      type: 'http',
      scheme: 'basic',
    })
  })

  it('transforms file type', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['image/png'],
      paths: {
        '/planets': {
          post: {
            description: 'Creates planet.',
            consumes: ['image/png'],
            parameters: [
              {
                in: 'body',
                required: true,
                schema: {
                  type: 'file',
                },
              },
            ],
          },
        },
      },
    })

    expect(result.paths?.['/planets']?.post?.requestBody).toStrictEqual({
      required: true,
      content: {
        'image/png': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })
  })

  it('transform response headers', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json'],
      paths: {
        '/planets': {
          get: {
            description: 'Get all planets from the system that the user has access to.',
            consumes: ['application/json'],
            responses: {
              '200': {
                description: 'A list of planets.',
                headers: {
                  next: {
                    description: 'link to next page',
                    type: 'string',
                    maxLength: 100,
                  },
                },
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

    expect(result.paths?.['/planets']?.get?.responses?.['200']).toStrictEqual({
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
      },
      headers: {
        next: {
          description: 'link to next page',
          schema: {
            type: 'string',
            maxLength: 100,
          },
        },
      },
    })
  })

  it('transform query parameter collectionFormat to new serialization keywords', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json'],
      paths: {
        '/planets': {
          get: {
            description: 'Get all planets from the system that the user has access to.',
            consumes: ['application/json'],
            parameters: [
              {
                name: 'tags',
                in: 'query',
                type: 'array',
                collectionFormat: 'pipes',
                items: {
                  type: 'string',
                },
              },
              {
                name: 'queryParam',
                in: 'query',
                type: 'array',
                collectionFormat: 'multi',
                items: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'A list of planets.',
                headers: {
                  next: {
                    description: 'link to next page',
                    type: 'string',
                    maxLength: 100,
                  },
                },
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

    expect(result.paths?.['/planets']?.get?.parameters).toStrictEqual([
      {
        name: 'tags',
        in: 'query',
        style: 'pipeDelimited',
        explode: false,
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      {
        name: 'queryParam',
        in: 'query',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    ])
  })

  it('transform path parameter collectionFormat to new serialization keywords', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json'],
      paths: {
        '/planets/{id}': {
          get: {
            description: 'Get all planets from the system that the user has access to.',
            consumes: ['application/json'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'A list of planets.',
                headers: {
                  next: {
                    description: 'link to next page',
                    type: 'string',
                    maxLength: 100,
                  },
                },
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

    expect(result.paths?.['/planets/{id}']?.get?.parameters).toStrictEqual([
      {
        name: 'id',
        in: 'path',
        style: 'simple',
        explode: false,
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    ])
  })

  it('transform header parameter collectionFormat to new serialization keywords', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json'],
      paths: {
        '/planets': {
          get: {
            description: 'Get all planets from the system that the user has access to.',
            consumes: ['application/json'],
            parameters: [
              {
                name: 'myHeader',
                in: 'header',
                type: 'array',
                collectionFormat: 'pipes',
                items: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'A list of planets.',
                headers: {
                  next: {
                    description: 'link to next page',
                    type: 'string',
                    maxLength: 100,
                  },
                },
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

    expect(result.paths?.['/planets']?.get?.parameters).toStrictEqual([
      {
        name: 'myHeader',
        in: 'header',
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    ])
  })

  it('upgrades parameters defined globally and path wide - without body and formData', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json'],
      parameters: {
        globalHeader: {
          description: 'a global defined header',
          in: 'header',
          name: 'global header',
          required: false,
          type: 'string',
        },
      },
      paths: {
        '/planets/{planetId}': {
          parameters: [
            {
              description: 'planet id',
              in: 'path',
              name: 'planetId',
              required: true,
              type: 'number',
            },
          ],
        },
      },
    })

    expect(result.paths?.['/planets/{planetId}']?.parameters).toStrictEqual([
      {
        description: 'planet id',
        in: 'path',
        name: 'planetId',
        required: true,
        schema: {
          type: 'number',
        },
      },
    ])

    expect(result.components?.parameters).toMatchObject({
      globalHeader: {
        description: 'a global defined header',
        in: 'header',
        name: 'global header',
        required: false,
        schema: {
          type: 'string',
        },
      },
    })
  })

  it('upgrades parameters defined globally and path wide - body and formData', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json'],
      consumes: ['application/xml'],
      parameters: {
        planetBody: {
          in: 'body',
          name: 'planet body',
          required: true,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
      },
      paths: {
        '/planets/{planetId}': {
          parameters: [
            {
              description: 'planet name',
              in: 'formData',
              name: 'name',
              required: true,
              type: 'string',
            },
            {
              description: 'planet size',
              in: 'formData',
              name: 'size',
              required: false,
              type: 'number',
            },
          ],
          post: {
            responses: {
              '201': {
                description: 'The planet just created.',
              },
            },
          },
        },
      },
    })

    expect(result.paths?.['/planets/{planetId}']?.post?.requestBody).toStrictEqual({
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                description: 'planet name',
                type: 'string',
              },
              size: {
                type: 'number',
                description: 'planet size',
              },
            },
          },
        },
      },
    })

    expect(result.components?.requestBodies).toStrictEqual({
      planetBody: {
        required: true,
        content: {
          'application/xml': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    })
  })

  it('upgrades parameters defined globally and correctly update all the references - body', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      produces: ['application/json'],
      consumes: ['application/xml'],
      parameters: {
        Body: {
          in: 'body',
          name: 'planet body',
          required: true,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
        'content type': {
          in: 'body',
          name: 'content type',
          required: true,
          schema: {
            type: 'string',
          },
        },
        Accept: {
          in: 'body',
          name: 'Accept',
          required: true,
          schema: {
            type: 'string',
          },
        },
      },
      paths: {
        '/planets/{planetId}': {
          parameters: [
            {
              '$ref': '#/parameters/Body',
            },
            {
              '$ref': '#/parameters/content type',
            },
            {
              '$ref': '#/parameters/Accept',
            },
          ],
          post: {
            responses: {
              '201': {
                description: 'The planet just created.',
              },
            },
          },
        },
      },
    })

    expect(result.paths?.['/planets/{planetId}']?.parameters).toMatchObject([
      {
        '$ref': '#/components/requestBodies/Body',
      },
      {
        '$ref': '#/components/requestBodies/content type',
      },
      {
        '$ref': '#/components/requestBodies/Accept',
      },
    ])

    expect(result.components?.requestBodies).toMatchObject({
      Body: {
        content: {
          'application/xml': {
            schema: {
              type: 'object',
              properties: { name: { type: 'string' } },
            },
          },
        },
        required: true,
      },
      'content type': {
        content: { 'application/xml': { schema: { type: 'string' } } },
        required: true,
      },
      Accept: {
        content: { 'application/xml': { schema: { type: 'string' } } },
        required: true,
      },
    })
  })

  it('upgrades parameters defined globally and correctly update all the references - parameters', async () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      'swagger': '2.0',
      'info': { 'version': '1.0.0', 'title': 'Minimal API' },
      'paths': {
        '/items/{id}': {
          'get': {
            'summary': 'Get item',
            'parameters': [{ '$ref': '#/parameters/ItemId' }],
            'responses': {
              '200': { 'description': 'OK' },
            },
          },
        },
      },
      'parameters': {
        'ItemId': {
          'name': 'id',
          'in': 'path',
          'type': 'string',
          'required': true,
        },
      },
    })

    // Update all the $rfs
    expect(result.paths?.['/items/{id}']?.get?.parameters).toMatchObject([
      {
        '$ref': '#/components/parameters/ItemId',
      },
    ])

    expect(result.components?.parameters).toEqual({
      'ItemId': {
        'in': 'path',
        'name': 'id',
        'required': true,
        'schema': {
          'type': 'string',
        },
      },
    })
  })

  it('deletes consumes array even if no request body parameter is specified', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      'swagger': '2.0',
      'info': { 'version': '1.0.0', 'title': 'Minimal API' },
      'paths': {
        '/noRequestBody': {
          'post': {
            'consumes': ['application/json', 'application/x-www-form-urlencoded'],
          },
        },
      },
    })

    expect(result.paths?.['/noRequestBody']?.post?.consumes).toBeUndefined()
  })

  it('migrates parameter reference objects accordingly', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      'swagger': '2.0',
      'info': { 'version': '1.0.0', 'title': 'Minimal API' },
      parameters: {
        planetId: {
          name: 'planetId',
          in: 'path',
          required: true,
          type: 'string',
        },
      },
      'paths': {
        '/planets/{planetId}': {
          'get': {
            parameters: [
              {
                $ref: '#/parameters/planetId',
              },
            ],
          },
        },
      },
    })

    expect(result.paths?.['/planets/{planetId}']?.get?.parameters?.[0]).toEqual({
      $ref: '#/components/parameters/planetId',
    })
  })
})
