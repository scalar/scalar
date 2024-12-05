/** @vitest-environment jsdom */
import type { SecuritySchemeOauth2 } from '@/entities/spec/security'
import { importSpecToWorkspace, parseSchema } from '@/transforms/import-spec'
import circular from '@test/fixtures/basic-circular-spec.json'
import modifiedPetStoreExample from '@test/fixtures/petstore-tls.json'
import { describe, expect, it } from 'vitest'

import galaxy from '../../../galaxy/dist/latest.json'

describe('importSpecToWorkspace', () => {
  describe('basics', () => {
    it('handles circular references', async () => {
      const res = await importSpecToWorkspace(circular)

      // console.log(JSON.stringify(res, null, 2))
      if (res.error) return

      expect(res.requests[0].path).toEqual('/api/v1/updateEmployee')
      expect(res.tags[0].children.includes(res.tags[1].uid)).toEqual(true)
      expect(
        res.tags[0].children.includes(Object.values(res.requests)[0].uid),
      ).toEqual(true)
    })

    it('handles a weird Petstore example', async () => {
      const res = await importSpecToWorkspace(modifiedPetStoreExample)

      expect(res.error).toBe(false)
    })

    it('loads the Scalar Galaxy example (with cyclic dependencies)', async () => {
      const res = await importSpecToWorkspace(galaxy)

      expect(res.error).toEqual(false)
    })

    it('merges path and operation parameters', async () => {
      const specWithParams = {
        ...galaxy,
        paths: {
          '/test/{id}': {
            parameters: [{ name: 'id', in: 'path', required: true }],
            get: {
              parameters: [{ name: 'filter', in: 'query' }],
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithParams)
      if (res.error) throw res.error

      const request = res.requests[0]
      expect(request.parameters).toHaveLength(2)
      expect(request.parameters?.map((p) => p.name)).toContain('id')
      expect(request.parameters?.map((p) => p.name)).toContain('filter')
    })

    it('handles requests in the order defined in the OpenAPI document', async () => {
      const res = await importSpecToWorkspace(galaxy)
      if (res.error) throw res.error

      expect(res.requests.map((r) => r.operationId)).toEqual([
        'getAllData',
        'createPlanet',
        'getPlanet',
        'updatePlanet',
        'deletePlanet',
        'uploadImage',
        'createUser',
        'getToken',
        'getMe',
      ])
    })
  })

  describe('tags', () => {
    it('creates missing tag definitions', async () => {
      const specWithUndefinedTags = {
        ...galaxy,
        tags: [],
        paths: {
          '/test': {
            get: {
              tags: ['undefined-tag'],
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithUndefinedTags)
      if (res.error) throw res.error

      expect(res.tags.some((t) => t.name === 'undefined-tag')).toBe(true)
    })

    it('handles requests without tags', async () => {
      const specWithUntaggedRequest = {
        ...galaxy,
        paths: {
          '/test': {
            get: {
              // No tags specified
              operationId: 'untaggedRequest',
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithUntaggedRequest)
      if (res.error) throw res.error

      // The untagged request should be in the collection's root children
      expect(res.collection.children).toContain(res.requests[0].uid)
    })
  })

  describe('security', () => {
    const testSchemes = [
      {
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authentication',
        nameKey: 'bearerAuth',
        password: '',
        scheme: 'bearer',
        token: '',
        type: 'http',
        username: '',
      },
      {
        bearerFormat: 'JWT',
        description: 'Basic HTTP authentication',
        nameKey: 'basicAuth',
        password: '',
        scheme: 'basic',
        token: '',
        type: 'http',
        username: '',
      },
      {
        description: 'API key request header',
        in: 'header',
        name: 'X-API-Key',
        nameKey: 'apiKeyHeader',
        type: 'apiKey',
        value: '',
      },
      {
        description: 'API key query parameter',
        in: 'query',
        name: 'api_key',
        nameKey: 'apiKeyQuery',
        type: 'apiKey',
        value: '',
      },
      {
        description: 'API key browser cookie',
        in: 'cookie',
        name: 'api_key',
        nameKey: 'apiKeyCookie',
        type: 'apiKey',
        value: '',
      },
      {
        description: 'OAuth 2.0 authentication',
        nameKey: 'oAuth2',
        type: 'oauth2',
        flows: {
          authorizationCode: {
            'authorizationUrl': 'https://galaxy.scalar.com/oauth/authorize',
            'clientSecret': '',
            'refreshUrl': '',
            'scopes': {
              'read:account': 'read your account information',
              'read:planets': 'read your planets',
              'write:planets': 'modify planets in your account',
            },
            'selectedScopes': [] as string[],
            'token': '',
            'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
            'type': 'authorizationCode',
            'x-scalar-redirect-uri': 'http://localhost:3000/',
            'x-usePkce': 'no',
            'x-scalar-client-id': '',
          },

          clientCredentials: {
            'clientSecret': '',
            'refreshUrl': '',
            'scopes': {
              'read:account': 'read your account information',
              'read:planets': 'read your planets',
              'write:planets': 'modify planets in your account',
            },
            'selectedScopes': [] as string[],
            'token': '',
            'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
            'type': 'clientCredentials',
            'x-scalar-client-id': '',
          },
          implicit: {
            'authorizationUrl': 'https://galaxy.scalar.com/oauth/authorize',
            'refreshUrl': '',
            'scopes': {
              'read:account': 'read your account information',
              'read:planets': 'read your planets',
              'write:planets': 'modify planets in your account',
            },
            'selectedScopes': [] as string[],
            'token': '',
            'type': 'implicit',
            'x-scalar-client-id': '',
            'x-scalar-redirect-uri': 'http://localhost:3000/',
          },
          password: {
            'clientSecret': '',
            'password': '',
            'refreshUrl': '',
            'scopes': {
              'read:account': 'read your account information',
              'read:planets': 'read your planets',
              'write:planets': 'modify planets in your account',
            },
            'selectedScopes': [] as string[],
            'token': '',
            'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
            'type': 'password',
            'username': '',
            'x-scalar-client-id': '',
          },
        },
      },
      {
        description: 'OpenID Connect Authentication',
        nameKey: 'openIdConnect',
        openIdConnectUrl:
          'https://galaxy.scalar.com/.well-known/openid-configuration',
        type: 'openIdConnect',
      },
    ]

    it('handles vanilla security schemes', async () => {
      const res = await importSpecToWorkspace(galaxy)
      if (res.error) throw res.error

      expect(res.securitySchemes.map(({ uid, ...rest }) => rest)).toEqual(
        testSchemes,
      )
    })

    it('supports the x-defaultClientId extension', async () => {
      const clonedGalaxy: any = structuredClone(galaxy)
      clonedGalaxy.components.securitySchemes.oAuth2.flows.authorizationCode[
        'x-defaultClientId'
      ] = 'test-default-client-id'

      const res = await importSpecToWorkspace(clonedGalaxy)
      if (res.error) throw res.error

      const authScheme = res.securitySchemes[5] as SecuritySchemeOauth2
      expect(
        authScheme.flows.authorizationCode?.['x-scalar-client-id'],
      ).toEqual('test-default-client-id')
    })

    it('prefills from the authentication property', async () => {
      const res = await importSpecToWorkspace(galaxy, {
        authentication: {
          apiKey: {
            token: 'test-api-key',
          },
          preferredSecurityScheme: 'apiKeyHeader',
          http: {
            basic: {
              username: 'test-username',
              password: 'test-password',
            },
            bearer: {
              token: 'test-bearer-token',
            },
          },
          oAuth2: {
            clientId: 'test-client-id',
            scopes: ['read:account', 'read:planets'],
            accessToken: 'test-access-token',
            state: 'test-state',
            username: 'test-username',
            password: 'test-password',
          },
        },
        setCollectionSecurity: true,
      })
      if (res.error) throw res.error

      // test if the values were filled
      const clonedSchemes = structuredClone(testSchemes)
      clonedSchemes[0].token = 'test-bearer-token'
      clonedSchemes[1].username = 'test-username'
      clonedSchemes[1].password = 'test-password'
      clonedSchemes[2].value = 'test-api-key'
      clonedSchemes[3].value = 'test-api-key'
      clonedSchemes[4].value = 'test-api-key'

      const flows = clonedSchemes[5].flows!
      flows.authorizationCode['x-scalar-client-id'] = 'test-client-id'
      flows.authorizationCode.token = 'test-access-token'
      flows.authorizationCode.selectedScopes = ['read:account', 'read:planets']
      flows.clientCredentials['x-scalar-client-id'] = 'test-client-id'
      flows.clientCredentials.token = 'test-access-token'
      flows.clientCredentials.selectedScopes = ['read:account', 'read:planets']
      flows.implicit['x-scalar-client-id'] = 'test-client-id'
      flows.implicit.token = 'test-access-token'
      flows.implicit.selectedScopes = ['read:account', 'read:planets']
      flows.password['x-scalar-client-id'] = 'test-client-id'
      flows.password.token = 'test-access-token'
      flows.password.selectedScopes = ['read:account', 'read:planets']
      flows.password.username = 'test-username'
      flows.password.password = 'test-password'

      const apiKey = res.securitySchemes.find(
        ({ nameKey }) => nameKey === 'apiKeyHeader',
      )

      expect(res.securitySchemes.map(({ uid, ...rest }) => rest)).toEqual(
        clonedSchemes,
      )
      expect(res.collection.selectedSecuritySchemeUids).toEqual([apiKey!.uid])
    })

    it('converts scope arrays to objects', async () => {
      const clonedGalaxy: any = structuredClone(galaxy)
      clonedGalaxy.components.securitySchemes.oAuth2.flows.authorizationCode.scopes =
        ['read:account', 'read:planets']

      const res = await importSpecToWorkspace(clonedGalaxy)
      if (res.error) throw res.error

      expect(
        (res.securitySchemes[5] as SecuritySchemeOauth2).flows!
          .authorizationCode!.scopes,
      ).toEqual({
        'read:account': '',
        'read:planets': '',
      })
    })

    it('handles empty security requirements', async () => {
      const specWithEmptySecurity = {
        ...galaxy,
        security: [{}],
        paths: {
          '/test': {
            get: {
              security: [{}],
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithEmptySecurity)
      if (res.error) throw res.error

      expect(res.requests[0].security).toEqual([{}])
    })

    it('prefers operation level security over global security', async () => {
      const specWithGlobalAndOperationSecurity = {
        ...galaxy,
        security: [{ bearerAuth: [] }],
        paths: {
          '/test': {
            get: {
              security: [{ basicAuth: [] }],
            },
          },
        },
      }

      const res = await importSpecToWorkspace(
        specWithGlobalAndOperationSecurity,
      )
      if (res.error) throw res.error

      // Operation level security should override global security
      expect(res.requests[0].security).toEqual([{ basicAuth: [] }])
    })

    it('sets collection level security when specified', async () => {
      const res = await importSpecToWorkspace(galaxy, {
        setCollectionSecurity: true,
        authentication: {
          preferredSecurityScheme: 'basicAuth',
        },
      })
      if (res.error) throw res.error

      expect(res.collection.selectedSecuritySchemeUids).toHaveLength(1)
      const scheme = res.securitySchemes.find(
        (s) => s.uid === res.collection.selectedSecuritySchemeUids[0],
      )
      expect(scheme?.nameKey).toBe('basicAuth')
    })

    it('handles oauth2 authentication configuration', async () => {
      const res = await importSpecToWorkspace(galaxy, {
        authentication: {
          // @ts-expect-error
          oAuth2: {
            clientId: 'test-client',
            scopes: ['read:account'],
          },
        },
      })
      if (res.error) throw res.error

      const flow = res.securitySchemes.find((s) => s.type === 'oauth2')?.flows
        .authorizationCode
      expect(flow?.['x-scalar-client-id']).toBe('test-client')
      expect(flow?.selectedScopes).toEqual(['read:account'])
    })
  })

  describe('servers', () => {
    it('vanilla servers are returned', async () => {
      const res = await importSpecToWorkspace(galaxy)
      if (res.error) throw res.error

      // Remove the UID for comparison
      expect(res.servers.map(({ uid, ...rest }) => rest)).toEqual(
        galaxy.servers,
      )
    })

    /** Galaxy with some relative servers */
    const relativeGalaxy = {
      ...galaxy,
      servers: [
        ...galaxy.servers,
        {
          url: '/api/v1',
        },
        {},
      ],
    }

    it('handles relative servers with window.location.origin', async () => {
      const res = await importSpecToWorkspace(relativeGalaxy)
      if (res.error) throw res.error

      // Test URLs only
      expect(res.servers.map(({ url }) => url)).toEqual([
        'https://galaxy.scalar.com',
        '{protocol}://void.scalar.com/{path}',
        'http://localhost:3000/api/v1',
        'http://localhost:3000',
      ])
    })

    it('handles baseServerURL for relative servers', async () => {
      const res = await importSpecToWorkspace(relativeGalaxy, {
        baseServerURL: 'https://scalar.com',
      })
      if (res.error) throw res.error

      // Test URLS only
      expect(res.servers.map(({ url }) => url)).toEqual([
        'https://galaxy.scalar.com',
        '{protocol}://void.scalar.com/{path}',
        'https://scalar.com/api/v1',
        'https://scalar.com',
      ])
    })

    it('handles overloading servers with the servers property', async () => {
      const res = await importSpecToWorkspace(relativeGalaxy, {
        servers: [{ url: 'https://scalar.com' }],
      })
      if (res.error) throw res.error

      // Test URLS only
      expect(res.servers.map(({ url }) => url)).toEqual(['https://scalar.com'])
    })
  })
})

describe('parseSchema', () => {
  it('handles valid OpenAPI spec', async () => {
    const input = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            operationId: 'getTest',
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
      },
    }

    const { schema, errors } = await parseSchema(input)

    expect(errors).toHaveLength(0)
    expect(schema).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            operationId: 'getTest',
          },
        },
      },
    })
  })

  it('handles internal references', async () => {
    const input = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          Foobar: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
      paths: {
        '/foobar': {
          get: {
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Foobar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const { schema, errors } = await parseSchema(input)

    expect(errors).toHaveLength(0)
    expect(schema.components?.schemas?.Foobar).toMatchObject({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    })
    expect(
      schema.paths?.['/foobar']?.get?.responses?.['200'].content[
        'application/json'
      ].schema,
    ).toMatchObject({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    })
  })

  it('handles invalid JSON', async () => {
    const { errors } = await parseSchema('"invalid')

    expect(errors).toMatchObject([{ code: 'MISSING_CHAR' }])
    expect(errors).toHaveLength(1)
  })

  it('handles invalid YAML', async () => {
    const { errors } = await parseSchema(`

      openapi: 3.1.0
      asd
    `)

    expect(errors).toMatchObject([{ code: 'MISSING_CHAR' }])
    expect(errors).toHaveLength(1)
  })
})
