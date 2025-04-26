/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'

import type { SecurityScheme, SecuritySchemeOauth2 } from '@scalar/types/entities'
import circular from '@test/fixtures/basic-circular-spec.json' assert { type: 'json' }
import modifiedPetStoreExample from '@test/fixtures/petstore-tls.json' assert { type: 'json' }
import galaxy from '../../../galaxy/dist/latest.json' assert { type: 'json' }
import { getSelectedSecuritySchemeUids, importSpecToWorkspace, parseSchema } from './import-spec.ts'

describe('getSelectedSecuritySchemeUids', () => {
  const securitySchemeMap = {
    'basic-auth': 'basic-uid' as SecurityScheme['uid'],
    'api-key': 'apikey-uid' as SecurityScheme['uid'],
    'oauth2': 'oauth-uid' as SecurityScheme['uid'],
  }

  it('should return first security requirement when no preferred scheme is provided', () => {
    const securityRequirements = ['basic-auth', 'api-key']
    const result = getSelectedSecuritySchemeUids(securityRequirements, undefined, securitySchemeMap)
    expect(result).toEqual(['basic-uid'])
  })

  it('should use preferred security scheme when available and valid', () => {
    const securityRequirements = ['basic-auth', 'api-key']
    const result = getSelectedSecuritySchemeUids(securityRequirements, ['api-key'], securitySchemeMap)
    expect(result).toEqual(['apikey-uid'])
  })

  it('preferred security scheme should override when not in requirements', () => {
    const securityRequirements = ['basic-auth', 'api-key']
    const result = getSelectedSecuritySchemeUids(securityRequirements, ['oauth2'], securitySchemeMap)
    expect(result).toEqual(['oauth-uid'])
  })

  it('should set the preferred security scheme when no requirements are provided', () => {
    const result = getSelectedSecuritySchemeUids([], ['basic-auth'], securitySchemeMap)
    expect(result).toEqual(['basic-uid'])
  })

  it('should select multiple security schemes when preferred scheme is an array', () => {
    const securityRequirements = ['basic-auth', 'api-key']
    const result = getSelectedSecuritySchemeUids(securityRequirements, ['basic-auth', 'api-key'], securitySchemeMap)
    expect(result).toEqual(['basic-uid', 'apikey-uid'])
  })

  it('should select multiple security schemes when preferred scheme is an array including complex', () => {
    const securityRequirements = ['basic-auth', 'api-key', ['basic-auth', 'api-key', 'oauth2']]
    const result = getSelectedSecuritySchemeUids(
      securityRequirements,
      [['basic-auth', 'api-key', 'oauth2'], 'api-key'],
      securitySchemeMap,
    )
    expect(result).toEqual([['basic-uid', 'apikey-uid', 'oauth-uid'], 'apikey-uid'])
  })

  it('should handle array-type security requirements', () => {
    const securityRequirements = [['basic-auth', 'api-key']]
    const result = getSelectedSecuritySchemeUids(securityRequirements, undefined, securitySchemeMap)
    expect(result).toEqual([['basic-uid', 'apikey-uid']])
  })

  it('should handle empty security requirements', () => {
    const securityRequirements: string[] = []
    const result = getSelectedSecuritySchemeUids(securityRequirements, undefined, securitySchemeMap)
    expect(result).toEqual([])
  })

  it('should handle undefined preferred scheme', () => {
    const securityRequirements = ['basic-auth']
    const result = getSelectedSecuritySchemeUids(securityRequirements, undefined, securitySchemeMap)
    expect(result).toEqual(['basic-uid'])
  })
})

describe('importSpecToWorkspace', () => {
  // Little helper
  const findSchemeUidByKey = (key: string, securitySchemes: SecurityScheme[]) =>
    securitySchemes.find((s) => s.nameKey === key)?.uid

  describe('basics', () => {
    it('handles circular references', async () => {
      const res = await importSpecToWorkspace(circular)

      // console.log(JSON.stringify(res, null, 2))
      if (res.error) {
        return
      }

      expect(res.requests[0]?.path).toEqual('/api/v1/updateEmployee')
      expect(res.tags[0]?.children.includes(res.tags[1]!.uid)).toEqual(true)
      expect(res.tags[0]?.children.includes(Object.values(res.requests)[0]!.uid)).toEqual(true)
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
      if (res.error) {
        throw res.error
      }

      const request = res.requests[0]
      expect(request!.parameters).toHaveLength(2)
      expect(request!.parameters?.map((p) => p.name)).toContain('id')
      expect(request!.parameters?.map((p) => p.name)).toContain('filter')
    })

    it('handles requests in the order defined in the OpenAPI document', async () => {
      const res = await importSpecToWorkspace(galaxy)
      if (res.error) {
        throw res.error
      }

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

  describe('info', () => {
    it('handles missing info object', async () => {
      const result = await importSpecToWorkspace({
        openapi: '3.1.0',
        // Missing info object
      })

      expect(result.error).toBe(false)
      expect(result.collection?.info).toEqual({
        title: 'API',
        version: '1.0',
      })
    })

    it('handles wrong format for info.title', async () => {
      const result = await importSpecToWorkspace({
        openapi: '3.1.0',
        info: {
          title: 123,
        },
      })

      expect(result.error).toBe(false)
      expect(result.collection?.info).toEqual({
        title: 'API',
        version: '1.0',
      })
    })

    it('handles wrong format for info.version', async () => {
      const result = await importSpecToWorkspace({
        openapi: '3.1.0',
        info: {
          title: 'My API',
          version: 123,
        },
      })

      expect(result.error).toBe(false)
      expect(result.collection?.info).toEqual({
        title: 'My API',
        version: '1.0',
      })
    })

    describe('contact', () => {
      it('leaves invalid email in contact object as is', async () => {
        const result = await importSpecToWorkspace({
          openapi: '3.1.0',
          info: {
            contact: {
              name: 'John Doe',
              url: 'not-actually-an-url',
              email: 'invalid @ email.com',
            },
          },
        })

        expect(result.error).toBe(false)
        expect(result.collection?.info?.contact).toEqual({
          name: 'John Doe',
          email: 'invalid @ email.com',
        })
      })
    })

    it("throws away the contact if it's not even strings", async () => {
      const result = await importSpecToWorkspace({
        openapi: '3.1.0',
        info: {
          contact: {
            name: 123,
          },
        },
      })

      expect(result.collection?.info?.contact).toEqual(undefined)
    })

    it('deals with incomeplete contact object', async () => {
      const result = await importSpecToWorkspace({
        openapi: '3.1.0',
        info: {
          contact: {
            name: 'John Doe',
          },
        },
      })

      expect(result.collection?.info?.contact).toEqual({
        name: 'John Doe',
      })
    })

    it('ignores additional properties in the contact object', async () => {
      const result = await importSpecToWorkspace({
        openapi: '3.1.0',
        info: {
          contact: {
            name: 'John Doe',
            extra: 'extra',
          },
        },
      })

      expect(result.collection?.info?.contact).toEqual({
        name: 'John Doe',
      })
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
      if (res.error) {
        throw res.error
      }

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
      if (res.error) {
        throw res.error
      }

      // The untagged request should be in the collection's root children
      expect(res.collection.children).toContain(res.requests[0]!.uid)
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
        openIdConnectUrl: 'https://galaxy.scalar.com/.well-known/openid-configuration',
        type: 'openIdConnect',
      },
    ]

    it('handles vanilla security schemes', async () => {
      const res = await importSpecToWorkspace(galaxy)
      if (res.error) {
        throw res.error
      }

      expect(res.securitySchemes.map(({ uid, ...rest }) => rest)).toEqual(testSchemes)
    })

    it('supports the x-defaultClientId extension', async () => {
      const clonedGalaxy: any = structuredClone(galaxy)
      clonedGalaxy.components.securitySchemes.oAuth2.flows.authorizationCode['x-defaultClientId'] =
        'test-default-client-id'

      const res = await importSpecToWorkspace(clonedGalaxy)
      if (res.error) {
        throw res.error
      }

      const authScheme = res.securitySchemes[5] as SecuritySchemeOauth2
      expect(authScheme.flows.authorizationCode?.['x-scalar-client-id']).toEqual('test-default-client-id')
    })

    it('prefills from the new authentication config', async () => {
      const res = await importSpecToWorkspace(galaxy, {
        authentication: {
          preferredSecurityScheme: 'apiKeyHeader',
          securitySchemes: {
            apiKeyHeader: {
              value: 'tokenHeader',
            },
            apiKeyQuery: {
              value: 'tokenQuery',
            },
            apiKeyCookie: {
              value: 'tokenCookie',
            },
            bearerAuth: {
              token: 'xyz token value',
            },
            basicAuth: {
              username: 'username',
              password: 'password',
            },
            oAuth2: {
              flows: {
                authorizationCode: {
                  token: 'auth code token',
                },
                clientCredentials: {
                  token: 'client credentials token',
                },
                implicit: {
                  token: 'implicit token',
                },
                password: {
                  username: 'user',
                  password: 'pass',
                  token: 'user pass token',
                },
              },
            },
          },
        },
        useCollectionSecurity: true,
      })
      if (res.error) {
        throw res.error
      }

      // test if the values were filled
      const clonedSchemes = structuredClone(testSchemes)

      clonedSchemes[0]!.token = 'xyz token value'
      clonedSchemes[1]!.username = 'username'
      clonedSchemes[1]!.password = 'password'
      clonedSchemes[2]!.value = 'tokenHeader'
      clonedSchemes[3]!.value = 'tokenQuery'
      clonedSchemes[4]!.value = 'tokenCookie'

      const flows = clonedSchemes[5]!.flows!
      flows.authorizationCode.token = 'auth code token'
      flows.password.token = 'user pass token'
      flows.password.username = 'user'
      flows.password.password = 'pass'
      flows.clientCredentials.token = 'client credentials token'
      flows.implicit.token = 'implicit token'

      const apiKey = res.securitySchemes.find(({ nameKey }) => nameKey === 'apiKeyHeader')

      expect(res.securitySchemes.map(({ uid, ...rest }) => rest)).toEqual(clonedSchemes)
      expect(res.collection.selectedSecuritySchemeUids).toEqual([apiKey!.uid])
    })

    it('prefills from the deprecated authentication property', async () => {
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
        useCollectionSecurity: true,
      } as any)
      if (res.error) {
        throw res.error
      }

      // test if the values were filled
      const clonedSchemes = structuredClone(testSchemes)
      clonedSchemes[0]!.token = 'test-bearer-token'
      clonedSchemes[1]!.username = 'test-username'
      clonedSchemes[1]!.password = 'test-password'
      clonedSchemes[2]!.value = 'test-api-key'
      clonedSchemes[3]!.value = 'test-api-key'
      clonedSchemes[4]!.value = 'test-api-key'

      const flows = clonedSchemes[5]!.flows!
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

      const apiKey = res.securitySchemes.find(({ nameKey }) => nameKey === 'apiKeyHeader')

      expect(res.securitySchemes.map(({ uid, ...rest }) => rest)).toEqual(clonedSchemes)
      expect(res.collection.selectedSecuritySchemeUids).toEqual([apiKey!.uid])
    })

    it('converts scope arrays to objects', async () => {
      const clonedGalaxy: any = structuredClone(galaxy)
      clonedGalaxy.components.securitySchemes.oAuth2.flows.authorizationCode.scopes = ['read:account', 'read:planets']

      const res = await importSpecToWorkspace(clonedGalaxy)
      if (res.error) {
        throw res.error
      }

      expect((res.securitySchemes[5] as SecuritySchemeOauth2).flows!.authorizationCode!.scopes).toEqual({
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
      if (res.error) {
        throw res.error
      }

      expect(res.requests[0]!.security).toEqual([{}])
    })

    it('handles empty security requirements with preferred security scheme', async () => {
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

      const res = await importSpecToWorkspace(specWithEmptySecurity, {
        useCollectionSecurity: true,
        authentication: {
          preferredSecurityScheme: 'basicAuth',
        },
      })
      if (res.error) {
        throw res.error
      }

      const scheme = res.securitySchemes.find((s) => s.nameKey === 'basicAuth')
      expect(res.collection.selectedSecuritySchemeUids).toEqual([scheme?.uid])
    })

    it('handles empty operation security requirements', async () => {
      const res = await importSpecToWorkspace({
        ...galaxy,
        paths: {
          '/test': {
            get: { security: [] },
          },
        },
      })

      if (res.error) {
        throw res.error
      }
      expect(res.requests[0]!.security).toEqual([])
    })

    it('imports path-level parameters', async () => {
      const example = {
        paths: {
          '/foobar': {
            get: {
              // operation-level parameter
              parameters: [{ name: 'bar', in: 'path' }],
            },
            // path-level parameter
            parameters: [{ name: 'foo', in: 'path' }],
          },
        },
      }

      const res = await importSpecToWorkspace(example)

      if (res.error) {
        throw res.error
      }

      expect(res.requests[0]!.parameters).toMatchObject([
        { name: 'foo', in: 'path' },
        { name: 'bar', in: 'path' },
      ])
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

      const res = await importSpecToWorkspace(specWithGlobalAndOperationSecurity)
      if (res.error) {
        throw res.error
      }

      // Operation level security should override global security
      expect(res.requests[0]!.security).toEqual([{ basicAuth: [] }])
    })

    it('sets collection level security when specified', async () => {
      const res = await importSpecToWorkspace(galaxy, {
        useCollectionSecurity: true,
        authentication: {
          preferredSecurityScheme: 'basicAuth',
        },
      })
      if (res.error) {
        throw res.error
      }

      expect(res.collection.selectedSecuritySchemeUids).toHaveLength(1)
      const scheme = res.securitySchemes.find((s) => s.uid === res.collection.selectedSecuritySchemeUids[0])
      expect(scheme?.nameKey).toBe('basicAuth')
    })

    it('handles oauth2 authentication configuration', async () => {
      const res = await importSpecToWorkspace(galaxy, {
        authentication: {
          oAuth2: {
            clientId: 'test-client',
            scopes: ['read:account'],
          },
        },
      } as any)
      if (res.error) {
        throw res.error
      }

      const flow = res.securitySchemes.find((s) => s.type === 'oauth2')?.flows.authorizationCode
      expect(flow?.['x-scalar-client-id']).toBe('test-client')
      expect(flow?.selectedScopes).toEqual(['read:account'])
    })

    it('handles an optional security scheme and sets selected security accordingly', async () => {
      const specWithAndSecurity = {
        ...galaxy,
        paths: {
          '/test': {
            get: {
              security: [{}],
              operationId: 'testOperation',
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithAndSecurity)
      if (res.error) {
        throw res.error
      }
      expect(res.requests[0]!.selectedSecuritySchemeUids).toEqual([])
    })

    it('sets the correct selectedSecuritySchemeUids when theres no collection security requirement', async () => {
      const { security, ...noSecurity } = galaxy
      const res = await importSpecToWorkspace(noSecurity, {
        useCollectionSecurity: true,
      })
      if (res.error) {
        throw res.error
      }

      expect(res.collection.selectedSecuritySchemeUids).toEqual([])
    })
  })

  describe('complex security', () => {
    it('handles AND security requirements', async () => {
      const specWithAndSecurity = {
        ...galaxy,
        security: [{ apiKeyHeader: [], basicAuth: [] }],
        paths: {
          '/test': {
            get: {
              operationId: 'testOperation',
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithAndSecurity)
      if (res.error) {
        throw res.error
      }

      const selectedSecuritySchemeUids = [
        [findSchemeUidByKey('apiKeyHeader', res.securitySchemes), findSchemeUidByKey('basicAuth', res.securitySchemes)],
      ]
      expect(res.requests[0]!.selectedSecuritySchemeUids).toEqual(selectedSecuritySchemeUids)
    })

    it('handles AND security requirements with useCollectionSecurity', async () => {
      const specWithAndSecurity = {
        ...galaxy,
        security: [{ apiKeyHeader: [], basicAuth: [] }, { bearerAuth: [] }],
        paths: {
          '/test': {
            get: {
              operationId: 'testOperation',
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithAndSecurity, {
        useCollectionSecurity: true,
      })
      if (res.error) {
        throw res.error
      }

      const selectedSecuritySchemeUids = [
        [findSchemeUidByKey('apiKeyHeader', res.securitySchemes), findSchemeUidByKey('basicAuth', res.securitySchemes)],
      ]

      expect(res.collection.selectedSecuritySchemeUids).toEqual(selectedSecuritySchemeUids)
    })

    it('selects the first required scheme as selected', async () => {
      const specWithOrSecurity = {
        ...galaxy,
        security: [{ apiKeyHeader: [] }, { basicAuth: [] }], // Either one
        paths: {
          '/test': {
            get: {
              operationId: 'testOperation',
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithOrSecurity)
      if (res.error) {
        throw res.error
      }

      // Check that the request inherits both options
      expect(res.requests[0]!.selectedSecuritySchemeUids).toEqual([
        findSchemeUidByKey('apiKeyHeader', res.securitySchemes),
      ])
    })

    it('handles empty security requirement in combination', async () => {
      const specWithOptionalAndRequired = {
        ...galaxy,
        security: [
          { apiKeyHeader: [] },
          {}, // Optional - no auth required
        ],
        paths: {
          '/test': {
            get: {
              operationId: 'testOperation',
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithOptionalAndRequired)
      if (res.error) {
        throw res.error
      }

      // Check that both the security requirement and the optional empty object are preserved
      expect(res.requests[0]!.selectedSecuritySchemeUids).toEqual([
        findSchemeUidByKey('apiKeyHeader', res.securitySchemes),
      ])
    })
  })

  describe('servers', () => {
    it('handles servers with different formats', async () => {
      const originalLocation = typeof window !== 'undefined' ? window.location : { origin: undefined }
      vi.stubGlobal('window', {
        location: {
          origin: 'http://localhost:3000',
        },
      })

      const result = await importSpecToWorkspace({
        servers: [
          { url: 'https://api.example.com' }, // Absolute URL
          { url: '/v2/api' }, // Relative path
          {
            url: '{scheme}://{environment}.api.example.com', // URL with variables
            variables: {
              scheme: {
                default: 'https',
                enum: ['http', 'https'],
              },
              environment: {
                default: 'prod',
                enum: ['dev', 'staging', 'prod'],
              },
            },
          },
        ],
      })

      if (result.error) {
        throw result.error
      }

      expect(result.servers).toMatchObject([
        { url: 'https://api.example.com' },
        { url: 'http://localhost:3000/v2/api' },
        {
          url: '{scheme}://{environment}.api.example.com',
          variables: {
            scheme: {
              default: 'https',
              enum: ['http', 'https'],
            },
            environment: {
              default: 'prod',
              enum: ['dev', 'staging', 'prod'],
            },
          },
        },
      ])

      // Restore the original window.location
      vi.stubGlobal('location', originalLocation)
    })

    it('returns both collection and operation servers when present', async () => {
      const result = await importSpecToWorkspace({
        servers: [{ url: 'https://collection-server.com' }],
        paths: {
          '/test': {
            get: {
              servers: [{ url: 'https://operation-server.com' }],
            },
          },
        },
      })

      if (result.error) {
        throw result.error
      }

      expect(result.servers).toHaveLength(2)
      expect(result.servers.map((s) => s.url)).toContain('https://collection-server.com')
      expect(result.servers.map((s) => s.url)).toContain('https://operation-server.com')
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
    expect(schema.paths?.['/foobar']?.get?.responses?.['200']?.content?.['application/json']?.schema).toMatchObject({
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

describe('getServersFromOpenApiDocument', () => {
  it('parses a simple server', async () => {
    const result = await importSpecToWorkspace({
      servers: [{ url: 'https://example.com' }],
    })

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'https://example.com' }])
  })

  it('prefixes relative servers with window.location.origin', async () => {
    const originalLocation = typeof window !== 'undefined' ? window.location : { origin: undefined }
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    })

    const result = await importSpecToWorkspace({
      servers: [{ url: '/api/v1' }],
    })

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'http://localhost:3000/api/v1' }])

    // Restore the original window.location
    vi.stubGlobal('location', originalLocation)
  })

  it('prefixes relative servers with baseServerURL when provided', async () => {
    const result = await importSpecToWorkspace(
      {
        servers: [{ url: '/api/v1' }],
      },
      {
        baseServerURL: 'https://scalar.com',
      },
    )

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'https://scalar.com/api/v1' }])
  })

  it('handles empty server objects by using localhost when no baseServerURL', async () => {
    const result = await importSpecToWorkspace({
      servers: [{}],
    })

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'http://localhost:3000' }])
  })

  it('handles servers with variables/templating', async () => {
    const result = await importSpecToWorkspace({
      servers: [
        {
          url: '{protocol}://api.example.com/{basePath}',
          variables: {
            protocol: {
              default: 'https',
              enum: ['http', 'https'],
            },
            basePath: {
              default: 'v1',
            },
          },
        },
      ],
    })

    if (result.error) {
      throw result.error
    }

    expect(result.servers[0]!.url).toBe('{protocol}://api.example.com/{basePath}')
    expect(result.servers[0]!.variables).toBeDefined()
  })

  it('handles multiple servers with mixed formats', async () => {
    const result = await importSpecToWorkspace(
      {
        servers: [{ url: 'https://prod.example.com' }, { url: '/api/v1' }, { url: '{protocol}://dev.example.com' }, {}],
      },
      {
        baseServerURL: 'https://scalar.com',
      },
    )

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([
      { url: 'https://prod.example.com' },
      { url: 'https://scalar.com/api/v1' },
      { url: '{protocol}://dev.example.com' },
    ])
  })

  it('handles trailing slashes in baseServerURL', async () => {
    const result = await importSpecToWorkspace(
      {
        servers: [{ url: '/api/v1' }],
      },
      {
        baseServerURL: 'https://scalar.com/',
      },
    )

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'https://scalar.com/api/v1' }])
  })

  it('handles leading slashes in server url', async () => {
    const result = await importSpecToWorkspace(
      {
        servers: [{ url: '//api/v1' }],
      },
      {
        baseServerURL: 'https://scalar.com',
      },
    )

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'https://scalar.com/api/v1' }])
  })

  it('returns an empty array for undefined servers', async () => {
    const result = await importSpecToWorkspace({})

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'http://localhost:3000' }])
  })

  it('returns an empty array when something is invalid', async () => {
    const result = await importSpecToWorkspace({
      servers: [{ url: false }],
    })

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'http://localhost:3000' }])
  })

  it('works without window.location', async () => {
    // Mock window.location for SSR/SSG environments
    const originalLocation = typeof window !== 'undefined' ? window.location : { origin: undefined }
    vi.stubGlobal('window', undefined)

    const result = await importSpecToWorkspace({
      servers: [{ url: '/api/v1' }],
    })

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: '/api/v1' }])

    // Restore the original window.location
    vi.stubGlobal('location', originalLocation)
  })

  it('uses current window.location.origin servers is empty', async () => {
    const originalLocation = typeof window !== 'undefined' ? window.location : { origin: undefined }
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    })

    const result = await importSpecToWorkspace({
      servers: [],
    })

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'http://localhost:3000' }])

    // Restore the original window.location
    vi.stubGlobal('location', originalLocation)
  })

  it('uses current window.location.origin when servers is undefined', async () => {
    const originalLocation = typeof window !== 'undefined' ? window.location : { origin: undefined }
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    })

    const result = await importSpecToWorkspace({})

    if (result.error) {
      throw result.error
    }

    expect(result.servers).toMatchObject([{ url: 'http://localhost:3000' }])

    // Restore the original window.location
    vi.stubGlobal('location', originalLocation)
  })
})
