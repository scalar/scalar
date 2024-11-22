import { describe, expect, it } from 'vitest'

import { createMockServer } from '../../src/createMockServer'
import { createOpenApiDefinition } from '../../src/utils/createOpenApiDefinition'

describe('OAuth 2.0 Authentication', () => {
  describe('Authorization Code Flow', () => {
    const specification = createOpenApiDefinition({
      oauth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: { read: 'Read access' },
          },
        },
      },
    })
    specification.paths = {
      '/oauth-test': {
        get: {
          security: [{ oauth2: ['read'] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    it('succeeds with valid OAuth token', async () => {
      const server = await createMockServer({ specification })
      const response = await server.request('/oauth-test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(response.status).toBe(200)
    })

    it('fails without OAuth token', async () => {
      const server = await createMockServer({ specification })
      const response = await server.request('/oauth-test')

      expect(response.status).toBe(401)
    })
  })

  describe('Implicit Flow', () => {
    const specification = createOpenApiDefinition({
      oauth2: {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: { read: 'Read access' },
          },
        },
      },
    })
    specification.paths = {
      '/oauth-test': {
        get: {
          security: [{ oauth2: ['read'] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    it('succeeds with valid OAuth token', async () => {
      const server = await createMockServer({ specification })
      const response = await server.request('/oauth-test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(response.status).toBe(200)
    })

    it('fails without OAuth token', async () => {
      const server = await createMockServer({ specification })
      const response = await server.request('/oauth-test')

      expect(response.status).toBe(401)
    })
  })

  describe('Client Credentials Flow', () => {
    const specification = createOpenApiDefinition({
      oauth2: {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: { read: 'Read access' },
          },
        },
      },
    })
    specification.paths = {
      '/oauth-test': {
        get: {
          security: [{ oauth2: ['read'] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    it('succeeds with valid OAuth token', async () => {
      const server = await createMockServer({ specification })
      const response = await server.request('/oauth-test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(response.status).toBe(200)
    })

    it('fails without OAuth token', async () => {
      const server = await createMockServer({ specification })
      const response = await server.request('/oauth-test')

      expect(response.status).toBe(401)
    })
  })

  describe('Password Flow', () => {
    const specification = createOpenApiDefinition({
      oauth2: {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: { read: 'Read access' },
          },
        },
      },
    })

    specification.paths = {
      '/oauth-test': {
        get: {
          security: [{ oauth2: ['read'] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    it('succeeds with valid OAuth token', async () => {
      const server = await createMockServer({ specification })

      const response = await server.request('/oauth-test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(response.status).toBe(200)
    })

    it('fails without OAuth token', async () => {
      const server = await createMockServer({ specification })
      const response = await server.request('/oauth-test')

      expect(response.status).toBe(401)
    })
  })
})
