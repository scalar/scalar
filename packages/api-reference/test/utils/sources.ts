import galaxy from '@scalar/galaxy/latest.json' with { type: 'json' }
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

/** All of the sources */
export type Sources = typeof sources
/** A single source configuration */
export type Source = Sources[number]
/** The slug of a source */
export type Slug = Source['slug']

/** A selection of test sources and configurations */
export const sources = [
  {
    title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
    slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
    content: galaxy,
  },
  {
    title: 'Scalar Galaxy (Classic Layout)',
    slug: 'scalar-galaxy-classic',
    content: galaxy,
    layout: 'classic',
  },
  {
    title: 'Scalar Galaxy Registry',
    slug: 'scalar-galaxy-registry',
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  },
  {
    title: 'Stripe',
    slug: 'stripe',
    url: 'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
  },
  {
    title: 'Relative URL Example',
    slug: 'relative-url',
    url: 'examples/openapi.json',
  },
  {
    title: 'Long Strings Example',
    slug: 'long-strings',
    url: 'examples/long-strings.yaml',
  },
  {
    title: 'Swagger Petstore 2.0',
    slug: 'swagger-petstore-2-0',
    url: 'https://petstore.swagger.io/v2/swagger.json',
  },
  {
    title: 'Swagger Petstore 3.0',
    slug: 'swagger-petstore-3-0',
    url: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
  {
    title: 'Swagger Petstore 3.1',
    slug: 'swagger-petstore-3-1',
    url: 'https://petstore31.swagger.io/api/v31/openapi.json',
  },
  {
    title: 'Hello World (string)',
    slug: 'hello-world-string',
    content: JSON.stringify({
      'openapi': '3.1.0',
      'info': {
        'title': 'SampleApi',
        'version': '1.0.1',
      },
      'components': {
        'schemas': {
          'UserIdInput': {
            'description': 'User identifier',
            'example': 'U234',
            'default': 'J1',
            'type': 'string',
          },
          'User': {
            'description': 'User Data',
            'example': {
              'name': 'Someone',
            },
            'type': 'object',
            'properties': {
              'name': {
                'default': 'Unknown',
                'type': 'string',
              },
            },
            'required': ['name'],
            'additionalProperties': false,
          },
        },
      },
      'paths': {
        '/login': {
          'post': {
            'requestBody': {
              'content': {
                'application/json': {
                  'schema': {
                    'type': 'object',
                    'properties': {
                      'userId': {
                        '$ref': '#/components/schemas/UserIdInput',
                      },
                    },
                  },
                },
              },
            },
            // 'parameters': [
            //   {
            //     'schema': {
            //       'example': 'wiiiiiiiiii',
            //       'type': 'string',
            //     },
            //     'in': 'query',
            //     'name': 'baz',
            //     'required': true,
            //     'description': 'query string example',
            //   },
            // ],
            'responses': {
              '200': {
                'description': 'Default Response',
                'content': {
                  'application/json': {
                    'schema': {
                      'type': 'object',
                      'properties': {
                        'user': {
                          '$ref': '#/components/schemas/User',
                        },
                        // 'users': {
                        //   'type': 'array',
                        //   'items': {
                        //     '$ref': '#/components/schemas/User',
                        //   },
                        // },
                      },
                      'required': [
                        'user',
                        //
                        // 'users',
                      ],
                      'additionalProperties': false,
                    },
                  },
                },
              },
            },
          },
        },
      },
      'servers': [],
    }),
  },
  {
    title: 'Valtown',
    slug: 'valtown',
    url: 'https://docs.val.town/openapi.documented.json',
  },
  {
    title: 'Zoom',
    slug: 'zoom',
    url: 'https://developers.zoom.us/api-hub/meetings/methods/endpoints.json',
    operationsSorter: 'alpha',
  },
  {
    title: 'Cloudinary',
    slug: 'cloudinary',
    url: 'https://cloudinary.com/documentation/schemas/analysis-api/public-schema.yml',
  },
  {
    title: 'Tailscale',
    slug: 'tailscale',
    url: 'https://api.tailscale.com/api/v2?outputOpenapiSchema=true',
  },
  {
    title: 'Maersk',
    slug: 'maersk',
    url: 'https://edpmediastorage.blob.core.windows.net/media/air_booking_v1-0_26092023_scalar_spec.yaml',
  },
  {
    title: 'Bolt',
    slug: 'bolt',
    url: 'https://assets.bolt.com/external-api-references/bolt.yml',
  },
  {
    title: 'OpenStatus',
    slug: 'openstatus',
    url: 'https://api.openstatus.dev/v1/openapi',
  },
  {
    title: 'Spotify',
    slug: 'spotify',
    url: 'https://developer.spotify.com/reference/web-api/open-api-schema.yaml',
  },
  {
    title: 'Circular',
    slug: 'circular',
    content: {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      components: {
        schemas: {
          JsonObject: {
            additionalProperties: {
              $ref: '#/components/schemas/JsonValue',
            },
            type: 'object',
          },
          JsonValue: {
            anyOf: [
              {
                type: 'string',
              },
              {
                type: 'number',
                format: 'double',
              },
              {
                type: 'boolean',
              },
              {
                $ref: '#/components/schemas/JsonObject',
              },
            ],
          },
        },
      },
      paths: {
        '/get': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/JsonObject',
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
  {
    title: 'Galaxy Live',
    slug: 'galaxy-live',
    url: 'http://localhost:8080/3.1.yaml',
  },
] as const satisfies AnyApiReferenceConfiguration
