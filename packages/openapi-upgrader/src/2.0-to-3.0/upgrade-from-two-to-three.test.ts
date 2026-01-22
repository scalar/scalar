import type { OpenAPIV3 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgrade-from-two-to-three'

describe('upgradeFromTwoToThree', () => {
  it('changes the version to from 3.0.0 to 3.1.0', () => {
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

  it('upgrades URLs to new server syntax', () => {
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

  it('upgrades basePath to new server syntax', () => {
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

  it('upgrades host to new server syntax', () => {
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

  it('moves definitions to components', () => {
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

  it('rewrites $refs to definitions', () => {
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

  it('transforms responses', () => {
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

  it('uses global produces for responses', () => {
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

  it('transforms requestBody', () => {
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

  it('transforms requestBody 2', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',

      paths: {
        '/pet/{petId}/uploadImage': {
          post: {
            tags: ['pet'],
            summary: 'uploads an image',
            description: '',
            operationId: 'uploadFile',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'petId',
                in: 'path',
                description: 'ID of pet to update',
                required: true,
                type: 'integer',
                format: 'int64',
              },
              {
                name: 'additionalMetadata',
                in: 'formData',
                description: 'Additional data to pass to server',
                required: false,
                type: 'string',
              },
              {
                name: 'file',
                in: 'formData',
                description: 'file to upload',
                required: false,
                type: 'file',
              },
            ],
            responses: {
              '200': {
                description: 'successful operation',
                schema: {
                  $ref: '#/definitions/ApiResponse',
                },
              },
            },
            security: [
              {
                petstore_auth: ['write:pets', 'read:pets'],
              },
            ],
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      '/pet/{petId}/uploadImage': {
        post: {
          tags: ['pet'],
          summary: 'uploads an image',
          description: '',
          operationId: 'uploadFile',
          parameters: [
            {
              schema: { type: 'integer', format: 'int64' },
              name: 'petId',
              in: 'path',
              description: 'ID of pet to update',
              required: true,
            },
          ],
          responses: {
            '200': {
              description: 'successful operation',
              content: {
                'application/json': { schema: { '$ref': '#/definitions/ApiResponse' } },
              },
            },
          },
          security: [{ petstore_auth: ['write:pets', 'read:pets'] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    additionalMetadata: {
                      type: 'string',
                      description: 'Additional data to pass to server',
                    },
                    file: { type: 'string', description: 'file to upload', format: 'binary' },
                  },
                  required: [],
                },
              },
            },
          },
        },
      },
    })
  })

  it('uses global consumes for requestBody', () => {
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

  it('migrates formData', () => {
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
              'multipart/form-data': {
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

  it('upgrades parameters defined globally and path wide - without body and formData', () => {
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

  it('upgrades parameters defined globally and path wide - body and formData', () => {
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
        'multipart/form-data': {
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

  it('upgrades parameters defined globally and correctly update all the references - body', () => {
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
              $ref: '#/parameters/Body',
            },
            {
              $ref: '#/parameters/content type',
            },
            {
              $ref: '#/parameters/Accept',
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
        $ref: '#/components/requestBodies/Body',
      },
      {
        $ref: '#/components/requestBodies/content type',
      },
      {
        $ref: '#/components/requestBodies/Accept',
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

  it('upgrades parameters defined globally and correctly update all the references - parameters', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { version: '1.0.0', title: 'Minimal API' },
      paths: {
        '/items/{id}': {
          get: {
            summary: 'Get item',
            parameters: [{ $ref: '#/parameters/ItemId' }],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
      parameters: {
        ItemId: {
          name: 'id',
          in: 'path',
          type: 'string',
          required: true,
        },
      },
    })

    // Update all the $rfs
    expect(result.paths?.['/items/{id}']?.get?.parameters).toMatchObject([
      {
        $ref: '#/components/parameters/ItemId',
      },
    ])

    expect(result.components?.parameters).toEqual({
      ItemId: {
        in: 'path',
        name: 'id',
        required: true,
        schema: {
          type: 'string',
        },
      },
    })
  })

  it('deletes consumes array even if no request body parameter is specified', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { version: '1.0.0', title: 'Minimal API' },
      paths: {
        '/noRequestBody': {
          post: {
            consumes: ['application/json', 'application/x-www-form-urlencoded'],
          },
        },
      },
    })

    expect(result.paths?.['/noRequestBody']?.post?.consumes).toBeUndefined()
  })

  it('migrates parameter reference objects accordingly', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { version: '1.0.0', title: 'Minimal API' },
      parameters: {
        planetId: {
          name: 'planetId',
          in: 'path',
          required: true,
          type: 'string',
        },
      },
      paths: {
        '/planets/{planetId}': {
          get: {
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

  it('allows reference objects in global parameters to be stored in components.parameters', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { version: '1.0.0', title: 'API with $ref parameters' },
      parameters: {
        reusableHeader: {
          $ref: '#/someOtherPlace/header',
        },
        normalParam: {
          name: 'id',
          in: 'query',
          type: 'string',
          required: false,
        },
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    expect(result.components?.parameters).toMatchObject({
      reusableHeader: {
        $ref: '#/someOtherPlace/header',
      },
      normalParam: {
        name: 'id',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
        },
      },
    })
  })

  it('validates that body parameters do not reach getParameterLocation', () => {
    const invalidSpec = {
      swagger: '2.0',
      info: { version: '1.0.0', title: 'Invalid API' },
      paths: {
        '/test': {
          post: {
            parameters: [
              {
                name: 'bodyParam',
                in: 'body',
                schema: {
                  type: 'object',
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    }

    // This should not throw because body parameters are filtered before reaching getParameterLocation
    expect(() => upgradeFromTwoToThree(invalidSpec)).not.toThrow()
  })

  it('transforms x-example on parameters to examples with value structure', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-example test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                in: 'header',
                name: 'Content-Type',
                type: 'string',
                required: true,
                'x-example': {
                  'application/json': {
                    message: 'OK',
                    type: 'success',
                  },
                  'text/plain': 'OK',
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const headerParameter = result.paths?.['/test']?.post?.parameters?.[0] as OpenAPIV3.ParameterObject
    expect(headerParameter.examples).toStrictEqual({
      'application/json': {
        value: {
          message: 'OK',
          type: 'success',
        },
      },
      'text/plain': {
        value: 'OK',
      },
    })
    // x-example should be removed
    expect((headerParameter as Record<string, unknown>)['x-example']).toBeUndefined()
  })

  it('transforms x-examples on body parameters with direct value to examples with default key', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-examples direct value test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'user',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    type: { type: 'string' },
                  },
                },
                'x-examples': {
                  'application/json': {
                    message: 'OK',
                    type: 'success',
                  },
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    expect(requestBody.content?.['application/json']?.examples).toStrictEqual({
      default: {
        value: {
          message: 'OK',
          type: 'success',
        },
      },
    })
  })

  it('transforms x-examples on body parameters with value and summary to named examples', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-examples named examples test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'user',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    type: { type: 'string' },
                  },
                },
                'x-examples': {
                  'application/json': {
                    'my-example-name': {
                      summary: 'Some Example',
                      value: {
                        message: 'OK',
                        type: 'success',
                      },
                    },
                    'another-example': {
                      summary: 'Another Example',
                      value: {
                        message: 'Something went wrong',
                        type: 'error',
                      },
                    },
                  },
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    expect(requestBody?.content?.['application/json']?.examples).toStrictEqual({
      'my-example-name': {
        summary: 'Some Example',
        value: {
          message: 'OK',
          type: 'success',
        },
      },
      'another-example': {
        summary: 'Another Example',
        value: {
          message: 'Something went wrong',
          type: 'error',
        },
      },
    })
  })

  it('transforms x-examples on body parameters with named examples without value wrappers', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-examples named examples without value wrappers', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'user',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    type: { type: 'string' },
                  },
                },
                // This is the "in the wild" format where named examples do not have `value` wrappers
                'x-examples': {
                  'application/json': {
                    'my-example-name': {
                      message: 'OK',
                      type: 'success',
                    },
                    'another-example': {
                      message: 'Something went wrong',
                      type: 'error',
                    },
                  },
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    // Should wrap each named example individually, not as a single default
    expect(requestBody?.content?.['application/json']?.examples).toStrictEqual({
      'my-example-name': {
        value: {
          message: 'OK',
          type: 'success',
        },
      },
      'another-example': {
        value: {
          message: 'Something went wrong',
          type: 'error',
        },
      },
    })
  })

  it('ignores x-example when it contains a non-object value like a string', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-example non-object test', version: '1.0' },
      paths: {
        '/test': {
          get: {
            parameters: [
              {
                in: 'header',
                name: 'X-Custom-Header',
                type: 'string',
                required: false,
                // This is an invalid x-example value (string instead of object)
                // It should be ignored to avoid producing garbage output like { "0": { value: "h" }, "1": { value: "e" }, ... }
                'x-example': 'hello',
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const headerParameter = result.paths?.['/test']?.get?.parameters?.[0] as OpenAPIV3.ParameterObject
    // Should not have examples since x-example was not a valid object
    expect(headerParameter.examples).toBeUndefined()
    // x-example should still be removed
    expect((headerParameter as Record<string, unknown>)['x-example']).toBeUndefined()
  })

  it('ignores x-example on body parameters when it contains a primitive value', () => {
    // This should not throw TypeError from using 'in' operator on a primitive
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-example primitive body test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'body',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                },
                // Invalid x-example value (string instead of object keyed by media type)
                'x-example': 'hello',
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    // Should not have example since x-example was not a valid object
    expect(requestBody.content?.['application/json']?.example).toBeUndefined()
  })

  it('ignores x-examples on body parameters when it contains a primitive value', () => {
    // This should not throw TypeError from using 'in' operator on a primitive
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-examples primitive body test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'body',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                },
                // Invalid x-examples value (number instead of object keyed by media type)
                'x-examples': 12345,
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    // Should not have examples since x-examples was not a valid object
    expect(requestBody.content?.['application/json']?.examples).toBeUndefined()
  })

  it('correctly wraps example data that happens to have a value property', () => {
    // This tests the fix for the false positive where example data with a "value" property
    // was incorrectly treated as an already-wrapped ExampleObject
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-examples with value property test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'body',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                },
                // The example data has a "value" property, but it is NOT an ExampleObject
                // because it also has "count" which is not an allowed ExampleObject property
                'x-examples': {
                  'application/json': {
                    'my-example': {
                      value: 'some data',
                      count: 5,
                    },
                  },
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    // The example should be wrapped properly, preserving the entire object including both "value" and "count"
    expect(requestBody.content?.['application/json']?.examples).toStrictEqual({
      'my-example': {
        value: {
          value: 'some data',
          count: 5,
        },
      },
    })
  })

  it('preserves valid ExampleObjects that only have allowed properties', () => {
    // This ensures we still recognize proper ExampleObjects (with summary, description, value, externalValue only)
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'valid ExampleObject test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'body',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                },
                // This is a valid ExampleObject structure - only has allowed properties
                'x-examples': {
                  'application/json': {
                    'my-example': {
                      summary: 'Example summary',
                      description: 'Example description',
                      value: {
                        name: 'Earth',
                        population: 8000000000,
                      },
                    },
                  },
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    // The ExampleObject should be preserved as-is since it's already valid
    expect(requestBody.content?.['application/json']?.examples).toStrictEqual({
      'my-example': {
        summary: 'Example summary',
        description: 'Example description',
        value: {
          name: 'Earth',
          population: 8000000000,
        },
      },
    })
  })

  it('correctly wraps parameter x-examples with data that has a value property', () => {
    // This tests the fix for parameters (non-body) with x-examples
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'parameter x-examples with value property test', version: '1.0' },
      paths: {
        '/test': {
          get: {
            parameters: [
              {
                in: 'header',
                name: 'X-Custom-Header',
                type: 'string',
                required: false,
                // The example data has a "value" property but is NOT an ExampleObject
                'x-examples': {
                  'example-1': {
                    value: 'data',
                    extra: 'field',
                  },
                },
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const headerParameter = result.paths?.['/test']?.get?.parameters?.[0] as OpenAPIV3.ParameterObject
    // Should wrap the example properly since "extra" is not an allowed ExampleObject property
    expect(headerParameter.examples).toStrictEqual({
      'example-1': {
        value: {
          value: 'data',
          extra: 'field',
        },
      },
    })
  })

  it('ignores x-example when it contains an array value', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-example array test', version: '1.0' },
      paths: {
        '/test': {
          get: {
            parameters: [
              {
                in: 'header',
                name: 'X-Custom-Header',
                type: 'string',
                required: false,
                // This is an invalid x-example value (array instead of object)
                // It should be ignored to avoid producing garbage output like { "0": { value: 1 }, "1": { value: 2 } }
                'x-example': [1, 2, 3],
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const headerParameter = result.paths?.['/test']?.get?.parameters?.[0] as OpenAPIV3.ParameterObject
    // Should not have examples since x-example was an array, not a valid object
    expect(headerParameter.examples).toBeUndefined()
    // x-example should still be removed
    expect((headerParameter as Record<string, unknown>)['x-example']).toBeUndefined()
  })

  it('ignores x-examples on body parameters when it contains an array value', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'x-examples array body test', version: '1.0' },
      paths: {
        '/test': {
          post: {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'body',
                in: 'body',
                required: true,
                schema: {
                  type: 'object',
                },
                // Invalid x-examples value (array instead of object keyed by media type)
                'x-examples': ['example1', 'example2'],
              },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    })

    const requestBody = result.paths?.['/test']?.post?.requestBody as OpenAPIV3.RequestBodyObject
    // Should not have examples since x-examples was an array, not a valid object
    expect(requestBody.content?.['application/json']?.examples).toBeUndefined()
  })

  it('transforms response examples from Swagger 2.0 to OpenAPI 3.0 format', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'Response examples test', version: '1.0' },
      produces: ['application/json'],
      paths: {
        '/api/dashboard/locations': {
          get: {
            responses: {
              '200': {
                description: 'Successful response',
                schema: {
                  type: 'object',
                  properties: {
                    locations: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
                examples: {
                  'application/json': {
                    locations: ['New York', 'Los Angeles'],
                  },
                },
              },
              '400': {
                description: 'Bad request',
                schema: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'object',
                      properties: {
                        client: { type: 'string' },
                      },
                    },
                  },
                },
                examples: {
                  'application/json': {
                    errors: {
                      client: 'Required parameter missing or the value is empty.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Check 200 response example
    const response200 = result.paths?.['/api/dashboard/locations']?.get?.responses?.['200'] as OpenAPIV3.ResponseObject
    expect(response200.content?.['application/json']?.example).toStrictEqual({
      locations: ['New York', 'Los Angeles'],
    })

    // Check 400 response example
    const response400 = result.paths?.['/api/dashboard/locations']?.get?.responses?.['400'] as OpenAPIV3.ResponseObject
    expect(response400.content?.['application/json']?.example).toStrictEqual({
      errors: {
        client: 'Required parameter missing or the value is empty.',
      },
    })

    // Ensure the old examples property is removed from responses
    expect((response200 as Record<string, unknown>).examples).toBeUndefined()
    expect((response400 as Record<string, unknown>).examples).toBeUndefined()
  })

  it('transforms response examples with multiple media types', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'Response examples multiple media types test', version: '1.0' },
      produces: ['application/json', 'application/xml'],
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'Successful response',
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
                examples: {
                  'application/json': {
                    message: 'Hello JSON',
                  },
                  'application/xml': '<message>Hello XML</message>',
                },
              },
            },
          },
        },
      },
    })

    const response200 = result.paths?.['/test']?.get?.responses?.['200'] as OpenAPIV3.ResponseObject
    expect(response200.content?.['application/json']?.example).toStrictEqual({
      message: 'Hello JSON',
    })
    expect(response200.content?.['application/xml']?.example).toBe('<message>Hello XML</message>')
  })

  it('transforms global responses defined in #/responses with examples', () => {
    const result: OpenAPIV3.Document = upgradeFromTwoToThree({
      swagger: '2.0',
      info: { title: 'Global responses test', version: '1.0' },
      produces: ['application/json'],
      paths: {
        '/api/dashboard/locations': {
          get: {
            responses: {
              '200': {
                $ref: '#/responses/locations-response',
              },
              '400': {
                $ref: '#/responses/error-response',
              },
            },
          },
        },
      },
      responses: {
        'locations-response': {
          description: 'Successful response with locations',
          schema: {
            type: 'object',
            properties: {
              locations: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          examples: {
            'application/json': {
              locations: ['New York', 'Los Angeles'],
            },
          },
        },
        'error-response': {
          description: 'Error response',
          schema: {
            type: 'object',
            properties: {
              errors: {
                type: 'object',
                properties: {
                  client: { type: 'string' },
                },
              },
            },
          },
          examples: {
            'application/json': {
              errors: {
                client: 'Required parameter missing or the value is empty.',
              },
            },
          },
        },
      },
    })

    // Check that $refs are updated to point to components/responses
    expect(result.paths?.['/api/dashboard/locations']?.get?.responses?.['200']).toStrictEqual({
      $ref: '#/components/responses/locations-response',
    })
    expect(result.paths?.['/api/dashboard/locations']?.get?.responses?.['400']).toStrictEqual({
      $ref: '#/components/responses/error-response',
    })

    // Check that global responses are moved to components.responses with transformed examples
    const locationsResponse = result.components?.responses?.['locations-response'] as OpenAPIV3.ResponseObject
    expect(locationsResponse.description).toBe('Successful response with locations')
    expect(locationsResponse.content?.['application/json']?.schema).toStrictEqual({
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    })
    expect(locationsResponse.content?.['application/json']?.example).toStrictEqual({
      locations: ['New York', 'Los Angeles'],
    })

    const errorResponse = result.components?.responses?.['error-response'] as OpenAPIV3.ResponseObject
    expect(errorResponse.description).toBe('Error response')
    expect(errorResponse.content?.['application/json']?.example).toStrictEqual({
      errors: {
        client: 'Required parameter missing or the value is empty.',
      },
    })

    // Ensure the old responses property is removed from document root
    expect((result as Record<string, unknown>).responses).toBeUndefined()
  })
})
