/** @vitest-environment jsdom */
import type { SecuritySchemeOauth2 } from '@/entities/spec/security'
import { importSpecToWorkspace } from '@/transforms/import-spec'
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
    it('handles vanilla security schemes', async () => {
      const res = await importSpecToWorkspace(galaxy)
      if (res.error) throw res.error

      expect(res.securitySchemes.map(({ uid, ...rest }) => rest)).toEqual([
        {
          bearerFormat: 'JWT',
          description: 'JWT Bearer token authentication',
          nameKey: 'bearerAuth',
          scheme: 'bearer',
          type: 'http',
        },
        {
          bearerFormat: 'JWT',
          description: 'Basic HTTP authentication',
          nameKey: 'basicAuth',
          scheme: 'basic',
          type: 'http',
        },
        {
          description: 'API key request header',
          in: 'header',
          name: 'X-API-Key',
          nameKey: 'apiKeyHeader',
          type: 'apiKey',
        },
        {
          description: 'API key query parameter',
          in: 'query',
          name: 'api_key',
          nameKey: 'apiKeyQuery',
          type: 'apiKey',
        },
        {
          description: 'API key browser cookie',
          in: 'cookie',
          name: 'api_key',
          nameKey: 'apiKeyCookie',
          type: 'apiKey',
        },
        {
          'description': 'OAuth 2.0 authentication',
          'flow': {
            'authorizationUrl': 'https://galaxy.scalar.com/oauth/authorize',
            'refreshUrl': '',
            'scopes': {
              'read:account': 'read your account information',
              'read:planets': 'read your planets',
              'write:planets': 'modify planets in your account',
            },
            'selectedScopes': [],
            'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
            'type': 'authorizationCode',
            'x-scalar-redirect-uri': 'http://localhost:3000/',
            'x-usePkce': 'no',
          },
          'nameKey': 'oAuth2',
          'type': 'oauth2',
          'x-scalar-client-id': '',
        },
        {
          description: 'OpenID Connect Authentication',
          nameKey: 'openIdConnect',
          openIdConnectUrl:
            'https://galaxy.scalar.com/.well-known/openid-configuration',
          type: 'openIdConnect',
        },
      ])
    })

    it('supports the x-defaultClientId extension', async () => {
      const testId = 'test-default-client-id'
      const clonedGalaxy: any = structuredClone(galaxy)
      clonedGalaxy.components.securitySchemes.oAuth2.flows.authorizationCode[
        'x-defaultClientId'
      ] = testId

      const res = await importSpecToWorkspace(clonedGalaxy)
      if (res.error) throw res.error

      const authScheme = res.securitySchemes[5] as SecuritySchemeOauth2
      console.log(authScheme)
      expect(
        authScheme.flows.authorizationCode?.['x-scalar-client-id'],
      ).toEqual(testId)
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

    it('handles array scopes conversion', async () => {
      const specWithArrayScopes = {
        ...galaxy,
        components: {
          securitySchemes: {
            oAuth2: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  scopes: ['read:test', 'write:test'],
                },
              },
            },
          },
        },
      }

      const res = await importSpecToWorkspace(specWithArrayScopes)
      if (res.error) throw res.error

      const oauth2Scheme = res.securitySchemes.find((s) => s.type === 'oauth2')
      expect(oauth2Scheme?.flow?.scopes).toEqual({
        'read:test': '',
        'write:test': '',
      })
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

      const oauth2Scheme = res.securitySchemes.find((s) => s.type === 'oauth2')
      expect(oauth2Scheme?.['x-scalar-client-id']).toBe('test-client')
      expect(oauth2Scheme?.flow?.selectedScopes).toEqual(['read:account'])
      it('prefills from the authentication property', async () => {
        const res = await importSpecToWorkspace(galaxy)
        if (res.error) throw res.error

        console.log(res.securitySchemes)
        expect(res.securitySchemes[5]).toEqual(null)
      })

      it('converts scope arrays to objects', async () => {
        const res = await importSpecToWorkspace(galaxy)
        if (res.error) throw res.error

        console.log(res.securitySchemes)
        expect(res.securitySchemes[5]).toEqual(null)
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
        expect(res.servers.map(({ url }) => url)).toEqual([
          'https://scalar.com',
        ])
      })
    })
  })
})
