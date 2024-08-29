import { importSpecToWorkspace } from '@/transforms/import-spec'
import { galaxySpec } from '@scalar/galaxy'
import { describe, expect, test } from 'vitest'

const circular = {
  openapi: '3.0.1',
  info: {
    title: 'Test OpenAPI definition',
    version: '1.0.0',
  },
  paths: {
    '/api/v1/updateEmployee': {
      put: {
        tags: ['employees'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Employee',
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/updateManager': {
      put: {
        tags: ['managers'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Employee',
                },
              },
            },
          },
        },
      },
      delete: {
        // tags: ['managers'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Employee',
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { 'name': 'employees', 'x-scalar-children': [{ tagName: 'managers' }] },
    { name: 'managers' },
  ],
  components: {
    schemas: {
      Employee: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          manager: {
            $ref: '#/components/schemas/Employee',
          },
          team: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Employee',
            },
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
      apiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
      apiKeyQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'api_key',
      },
      apiKeyCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'api_key',
      },
      oauth2: {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://galaxy.scalar.com/oauth/authorize',
            scopes: {
              'write:planets': 'modify planets in your account',
              'read:planets': 'read your planets',
            },
          },
        },
      },
    },
  },
}

describe('Import OAS Specs', () => {
  test('Handles circular', async () => {
    const res = await importSpecToWorkspace(circular)

    // console.log(JSON.stringify(res, null, 2))
    if (res.error) return

    expect(res.requests[0].path).toEqual('/api/v1/updateEmployee')
    expect(res.tags[0].children.includes(res.tags[1].uid)).toEqual(true)
    expect(
      res.tags[0].children.includes(Object.values(res.requests)[0].uid),
    ).toEqual(true)
  })

  test('Loads galaxy spec', async () => {
    const res = await importSpecToWorkspace(galaxySpec)

    expect(res.error).toEqual(false)
  })
})
