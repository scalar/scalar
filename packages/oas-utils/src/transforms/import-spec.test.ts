/** @vitest-environment jsdom */
import type { SecuritySchemeOauth2 } from '@/entities/spec/security'
import { importSpecToWorkspace } from '@/transforms/import-spec'
import circular from '@test/fixtures/basic-circular-spec.json'
import modifiedPetStoreExample from '@test/fixtures/petstore-tls.json'
import { describe, expect, it } from 'vitest'

import galaxy from '../../../galaxy/dist/latest.json'

describe('import-spec', () => {
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
      expect(authScheme['x-scalar-client-id']).toEqual(testId)
    })
  })

  // Servers
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
