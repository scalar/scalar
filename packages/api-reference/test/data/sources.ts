import type { AnyApiReferenceConfiguration } from '@scalar/types'

export default [
  {
    title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
    slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
    url: 'https://galaxy.scalar.com/openapi.yaml',
  },
  {
    title: 'Scalar Galaxy Registry',
    slug: 'scalar-galaxy-registry',
    url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
  },
  {
    title: 'Scalar Galaxy (Classic Layout)',
    slug: 'scalar-galaxy-classic',
    url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
    layout: 'classic',
  },
  {
    title: 'Relative URL Example',
    slug: 'relative-url',
    url: 'examples/openapi.json',
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
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/hello': {
          get: {
            summary: 'Hello World',
            description: 'Hello World',
            responses: {
              200: {
                description: 'Hello World',
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
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
] satisfies AnyApiReferenceConfiguration
