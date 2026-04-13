import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { type OAuthFlowsObjectSecret, mergeSecurity } from '@scalar/workspace-store/request-example'
import type { ComponentsObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { flushPromises } from '@vue/test-utils'
import { encode } from 'js-base64'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authorizeOauth2 } from './oauth'

const baseFlow = {
  'refreshUrl': 'https://auth.example.com/refresh',
  'scopes': {
    read: 'Read access',
    write: 'Write access',
  },
  'x-scalar-secret-client-id': 'xxxxx',
}
const selectedScopes = ['read', 'write']

const scope = Object.keys(baseFlow.scopes)
const authorizationUrl = 'https://auth.example.com/authorize'
const tokenUrl = 'https://auth.example.com/token'
const redirectUri = 'https://callback.example.com'
const clientSecret = 'yyyyy'
const secretAuth = encode(`${baseFlow['x-scalar-secret-client-id']}:${clientSecret}`)

const windowTarget = 'openAuth2Window'
const windowFeatures = 'left=100,top=100,width=800,height=600'

/** This state corresponds to Math.random() === 0.123456 */
const state = '4fzyo82m'
const randomVal = 0.123456

describe('oauth', () => {
  // Mock window.open
  let mockWindow: any

  beforeEach(() => {
    mockWindow = {
      close: vi.fn(),
      closed: false,
      location: {
        href: '',
      },
    }
    vi.spyOn(window, 'open').mockImplementation(() => mockWindow)
    // To skip timers
    vi.useFakeTimers()
    // For predictable state
    vi.spyOn(Math, 'random').mockReturnValue(randomVal)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  const mockServer = {
    url: 'https://api.example.com',
  } as ServerObject

  describe('Authorization Code Grant', () => {
    const scheme = {
      authorizationCode: {
        ...baseFlow,
        'x-usePkce': 'no',
        authorizationUrl,
        tokenUrl,
        'x-scalar-secret-redirect-uri': redirectUri,
        'x-scalar-secret-token': '',
        'x-scalar-secret-client-secret': clientSecret,
      },
    } satisfies OAuthFlowsObjectSecret

    it('should handle successful authorization code flow', async () => {
      const promise = authorizeOauth2(scheme, 'authorizationCode', selectedScopes, mockServer, '')
      const accessToken = 'access_token_123'

      // Test the window.open call
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${scheme.authorizationCode.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            redirect_uri: scheme.authorizationCode['x-scalar-secret-redirect-uri'],
            client_id: scheme.authorizationCode['x-scalar-secret-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )

      // Mock redirect back from login
      mockWindow.location.href = `${scheme.authorizationCode['x-scalar-secret-redirect-uri']}?code=auth_code_123&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Test the server call
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          redirect_uri: scheme.authorizationCode['x-scalar-secret-redirect-uri'],
          code: 'auth_code_123',
          grant_type: 'authorization_code',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })
    })

    it('sends client_id in token body for authorization code public clients', async () => {
      const flows = {
        authorizationCode: {
          ...scheme.authorizationCode,
          'x-scalar-secret-client-secret': '',
        },
      } satisfies OAuthFlowsObjectSecret

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, mockServer, '')
      const code = 'auth_code_public_123'
      const accessToken = 'access_token_public_123'

      mockWindow.location.href = `${flows.authorizationCode['x-scalar-secret-redirect-uri']}?code=${code}&state=${state}`

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      vi.advanceTimersByTime(200)

      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: expect.any(URLSearchParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      const expectedParams = new URLSearchParams()
      expectedParams.set('client_id', flows.authorizationCode['x-scalar-secret-client-id'])
      expectedParams.set('redirect_uri', flows.authorizationCode['x-scalar-secret-redirect-uri'])
      expectedParams.set('code', code)
      expectedParams.set('grant_type', 'authorization_code')
      expect(body.toString()).toBe(expectedParams.toString())
    })

    // PKCE
    it('should generate valid PKCE code verifier and challenge using SHA-256 encryption', async () => {
      const flows = {
        authorizationCode: {
          ...scheme.authorizationCode,
          'x-usePkce': 'SHA-256',
          'x-scalar-security-query': {
            prompt: 'login',
            audience: 'scalar',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      const accessToken = 'pkce_access_token_123'
      const codeChallenge = 'AQIDBAUGCAkK'
      const code = 'pkce_auth_code_123'

      // Mock crypto.getRandomValues
      vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
        if (arr instanceof Uint8Array) {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i
          }
        }
        return arr
      })

      // Mock crypto.subtle.digest
      vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5, 6, 8, 9, 10]).buffer)

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, mockServer, '')
      await flushPromises()

      // Test the window.open call
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${flows.authorizationCode.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            redirect_uri: flows.authorizationCode['x-scalar-secret-redirect-uri'],
            prompt: 'login',
            audience: 'scalar',
            client_id: flows.authorizationCode['x-scalar-secret-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )
      mockWindow.location.href = `https://callback.example.com?code=${code}&state=${state}`

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Check fetch parameters
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
        body: new URLSearchParams({
          redirect_uri: flows.authorizationCode['x-scalar-secret-redirect-uri'],
          code,
          grant_type: 'authorization_code',
          code_verifier: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8',
        }),
      })
    })

    it('should include x-scalar-security-body parameters in authorization code token request', async () => {
      const flows = {
        'authorizationCode': {
          ...scheme.authorizationCode,
          'x-scalar-security-body': {
            audience: 'https://api.example.com',
            custom_param: 'custom_value',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, mockServer, '')
      const accessToken = 'access_token_123'
      const code = 'auth_code_123'

      // Mock redirect back from login
      mockWindow.location.href = `${flows.authorizationCode['x-scalar-secret-redirect-uri']}?code=${code}&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Test the server call includes custom body parameters
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          redirect_uri: flows.authorizationCode['x-scalar-secret-redirect-uri'],
          code,
          grant_type: 'authorization_code',
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })
    })

    // Test user closing the window
    it('should handle window closure before authorization', async () => {
      const promise = authorizeOauth2(scheme, 'authorizationCode', selectedScopes, mockServer, '')

      mockWindow.closed = true
      vi.advanceTimersByTime(200)

      const [error, result] = await promise
      expect(result).toBe(null)
      expect(error).toBeInstanceOf(Error)
      expect(error!.message).toBe('Window was closed without granting authorization')
    })

    // Test relative redirect URIs
    it('should handle relative redirect URIs', () => {
      const flows = {
        'authorizationCode': {
          ...scheme.authorizationCode,
          'x-scalar-secret-redirect-uri': '/callback',
        },
      } satisfies OAuthFlowsObjectSecret

      void authorizeOauth2(flows, 'authorizationCode', selectedScopes, mockServer, '')

      // Test the window.open call for full redirect
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${flows.authorizationCode.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            redirect_uri: `${mockServer.url}/callback`,
            client_id: flows.authorizationCode['x-scalar-secret-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )
    })

    it('should handle relative URLs when no active server is provided', async () => {
      const flows = {
        'authorizationCode': {
          ...scheme.authorizationCode,
          authorizationUrl: '/oauth/authorize',
          tokenUrl: '/oauth/token',
        },
      } satisfies OAuthFlowsObjectSecret

      // Mock window.location
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'https://example.com',
          pathname: '/docs',
          href: 'https://example.com/docs',
        },
        writable: true,
      })

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, null, '')
      const accessToken = 'access_token_123'

      // Test the window.open call uses window.location as base
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `https://example.com/oauth/authorize?${new URLSearchParams({
            response_type: 'code',
            redirect_uri: flows.authorizationCode['x-scalar-secret-redirect-uri'],
            client_id: flows.authorizationCode['x-scalar-secret-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )

      // Mock redirect back from login
      mockWindow.location.href = `${flows.authorizationCode['x-scalar-secret-redirect-uri']}?code=auth_code_123&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Test the server call uses window.location as base
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/oauth/token', {
        method: 'POST',
        body: new URLSearchParams({
          redirect_uri: flows.authorizationCode['x-scalar-secret-redirect-uri'],
          code: 'auth_code_123',
          grant_type: 'authorization_code',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })

      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    // State mismatch
    it('blow up on state mismatch', async () => {
      const promise = authorizeOauth2(scheme, 'authorizationCode', selectedScopes, mockServer, '')

      // Mock redirect with bad state
      mockWindow.location.href = `${scheme.authorizationCode['x-scalar-secret-redirect-uri']}?code=auth_code_123&state=bad_state`
      vi.advanceTimersByTime(200)

      const [error, result] = await promise
      expect(result).toBe(null)
      expect(error).toBeInstanceOf(Error)
      expect(error!.message).toBe('State mismatch')
    })

    it('should use the proxy if provided', async () => {
      const promise = authorizeOauth2(
        scheme,
        'authorizationCode',
        selectedScopes,
        mockServer,
        'https://proxy.example.com',
      )

      const accessToken = 'access_token_123'

      // Test the window.open call
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${scheme.authorizationCode.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            redirect_uri: scheme.authorizationCode['x-scalar-secret-redirect-uri'],
            client_id: scheme.authorizationCode['x-scalar-secret-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )

      // Mock redirect back from login
      mockWindow.location.href = `${scheme.authorizationCode['x-scalar-secret-redirect-uri']}?code=auth_code_123&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Test the server call
      expect(global.fetch).toHaveBeenCalledWith(
        'https://proxy.example.com?scalar_url=https%3A%2F%2Fauth.example.com%2Ftoken',
        {
          method: 'POST',
          body: new URLSearchParams({
            redirect_uri: scheme.authorizationCode['x-scalar-secret-redirect-uri'],
            code: 'auth_code_123',
            grant_type: 'authorization_code',
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${secretAuth}`,
          },
        },
      )
    })

    it('should handle authorization code flow with body-only credentials location', async () => {
      const flows = {
        authorizationCode: {
          ...scheme.authorizationCode,
          'x-scalar-credentials-location': 'body',
        },
      } satisfies OAuthFlowsObjectSecret

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, mockServer, '')
      const accessToken = 'access_token_123'

      // Mock redirect back from login
      mockWindow.location.href = `${flows.authorizationCode['x-scalar-secret-redirect-uri']}?code=auth_code_123&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Test the server call - credentials should be in body, not in header
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: expect.any(URLSearchParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      // Order matches implementation: client_id/client_secret, redirect_uri, code, grant_type
      const expectedParams = new URLSearchParams()
      expectedParams.set('client_id', flows.authorizationCode['x-scalar-secret-client-id'])
      expectedParams.set('client_secret', flows.authorizationCode['x-scalar-secret-client-secret'])
      expectedParams.set('redirect_uri', flows.authorizationCode['x-scalar-secret-redirect-uri'])
      expectedParams.set('code', 'auth_code_123')
      expectedParams.set('grant_type', 'authorization_code')
      expect(body.toString()).toBe(expectedParams.toString())
    })

    it('should handle authorization code flow with PKCE and body-only credentials location', async () => {
      const flows = {
        authorizationCode: {
          ...scheme.authorizationCode,
          'x-usePkce': 'SHA-256',
          'x-scalar-credentials-location': 'body',
        },
      } satisfies OAuthFlowsObjectSecret

      const accessToken = 'pkce_access_token_123'
      const code = 'pkce_auth_code_123'

      // Mock crypto.getRandomValues
      vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
        if (arr instanceof Uint8Array) {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i
          }
        }
        return arr
      })

      // Mock crypto.subtle.digest
      vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5, 6, 8, 9, 10]).buffer)

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, mockServer, '')
      await flushPromises()

      mockWindow.location.href = `https://callback.example.com?code=${code}&state=${state}`

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Check fetch parameters - credentials should be in body, not in header
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.any(URLSearchParams),
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      // Order matches implementation: client_id/client_secret, redirect_uri, code, grant_type, code_verifier
      const expectedParams = new URLSearchParams()
      expectedParams.set('client_id', flows.authorizationCode['x-scalar-secret-client-id'])
      expectedParams.set('client_secret', flows.authorizationCode['x-scalar-secret-client-secret'])
      expectedParams.set('redirect_uri', flows.authorizationCode['x-scalar-secret-redirect-uri'])
      expectedParams.set('code', code)
      expectedParams.set('grant_type', 'authorization_code')
      expectedParams.set('code_verifier', 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8')
      expect(body.toString()).toBe(expectedParams.toString())
    })

    it('should handle authorization code flow with body-only credentials and x-scalar-security-body parameters', async () => {
      const flows = {
        authorizationCode: {
          ...scheme.authorizationCode,
          'x-scalar-credentials-location': 'body',
          'x-scalar-security-body': {
            audience: 'https://api.example.com',
            custom_param: 'custom_value',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, mockServer, '')
      const accessToken = 'access_token_123'
      const code = 'auth_code_123'

      // Mock redirect back from login
      mockWindow.location.href = `${flows.authorizationCode['x-scalar-secret-redirect-uri']}?code=${code}&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken })

      // Test the server call - credentials in body, custom params also in body, no Authorization header
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: expect.any(URLSearchParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      // Order matches implementation: client_id/client_secret, redirect_uri, code, grant_type, then x-scalar-security-body params
      const expectedParams = new URLSearchParams()
      expectedParams.set('client_id', flows.authorizationCode['x-scalar-secret-client-id'])
      expectedParams.set('client_secret', flows.authorizationCode['x-scalar-secret-client-secret'])
      expectedParams.set('redirect_uri', flows.authorizationCode['x-scalar-secret-redirect-uri'])
      expectedParams.set('code', code)
      expectedParams.set('grant_type', 'authorization_code')
      expectedParams.set('audience', 'https://api.example.com')
      expectedParams.set('custom_param', 'custom_value')
      expect(body.toString()).toBe(expectedParams.toString())
    })
  })

  describe('Client Credentials Grant', () => {
    const scheme = {
      clientCredentials: {
        ...baseFlow,
        tokenUrl,
        'x-scalar-secret-client-secret': clientSecret,
        'x-scalar-secret-token': '',
      },
    } satisfies OAuthFlowsObjectSecret

    it('should handle successful client credentials flow', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(scheme, 'clientCredentials', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          scope: scope.join(' '),
          grant_type: 'client_credentials',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })
    })

    it('should handle token request failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
      const [error, result] = await authorizeOauth2(scheme, 'clientCredentials', selectedScopes, mockServer, '')
      expect(result).toBe(null)
      expect(error).toBeInstanceOf(Error)
      expect(error!.message).toBe('Failed to get an access token. Please check your credentials.')
    })

    it('should use custom token name when x-tokenName is specified', async () => {
      const flows = {
        clientCredentials: {
          ...scheme.clientCredentials,
          'x-tokenName': 'custom_access_token',
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ custom_access_token: 'custom_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'custom_token_123' })
    })

    it('should include x-scalar-security-body parameters in token request', async () => {
      const flows = {
        clientCredentials: {
          ...scheme.clientCredentials,
          'x-scalar-security-body': {
            audience: 'https://api.example.com',
            custom_param: 'custom_value',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          scope: scope.join(' '),
          grant_type: 'client_credentials',
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })
    })

    it('should keep empty x-scalar-security-body values in token request', async () => {
      const flows = {
        clientCredentials: {
          ...scheme.clientCredentials,
          'x-scalar-security-body': {
            audience: '',
            resource: 'https://api.example.com',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      expect(body.get('audience')).toBe('')
      expect(body.get('resource')).toBe('https://api.example.com')
    })

    it('should handle client credentials flow with body-only credentials location', async () => {
      const flows = {
        clientCredentials: {
          ...scheme.clientCredentials,
          'x-scalar-credentials-location': 'body',
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: expect.any(URLSearchParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      expect(body.toString()).toBe(
        new URLSearchParams({
          scope: scope.join(' '),
          client_id: flows.clientCredentials['x-scalar-secret-client-id'],
          client_secret: flows.clientCredentials['x-scalar-secret-client-secret'],
          grant_type: 'client_credentials',
        }).toString(),
      )
    })

    it('should handle client credentials flow with body-only credentials and x-scalar-security-body parameters', async () => {
      const flows = {
        clientCredentials: {
          ...scheme.clientCredentials,
          'x-scalar-credentials-location': 'body',
          'x-scalar-security-body': {
            audience: 'https://api.example.com',
            custom_param: 'custom_value',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: expect.any(URLSearchParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      expect(body.toString()).toBe(
        new URLSearchParams({
          scope: scope.join(' '),
          client_id: flows.clientCredentials['x-scalar-secret-client-id'],
          client_secret: flows.clientCredentials['x-scalar-secret-client-secret'],
          grant_type: 'client_credentials',
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        }).toString(),
      )
    })

    it('should handle relative token URL in client credentials flow', async () => {
      const flows = {
        clientCredentials: {
          ...scheme.clientCredentials,
          tokenUrl: '/oauth/token',
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })

      // Test the server call uses absolute URL
      expect(global.fetch).toHaveBeenCalledWith(`${mockServer.url}/oauth/token`, {
        method: 'POST',
        body: new URLSearchParams({
          scope: scope.join(' '),
          grant_type: 'client_credentials',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })
    })

    it('keeps x-scalar-security-body in clientCredentials from scheme to token request body', async () => {
      const documentSlug = 'issue-8516-document'
      const schemeName = 'OAuth2 Bearer'
      const securitySchemes: ComponentsObject['securitySchemes'] = {
        [schemeName]: {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              scopes: {
                'user:read': 'TEST',
              },
              refreshUrl: '',
              tokenUrl,
              'x-scalar-security-body': {
                audience: 'scalar',
              },
              'x-scalar-credentials-location': 'body',
            },
          },
        },
      }

      const workspaceStore = createWorkspaceStore()
      workspaceStore.auth.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        clientCredentials: {
          'x-scalar-secret-client-id': 'TEST_CLIENT_ID',
          'x-scalar-secret-client-secret': 'TEST_CLIENT_SECRET',
        },
      })

      const merged = mergeSecurity(securitySchemes, {}, workspaceStore.auth, documentSlug)
      const mergedFlow = merged[schemeName]?.type === 'oauth2' ? merged[schemeName].flows.clientCredentials : undefined
      if (!mergedFlow) {
        throw new Error('Expected merged OAuth2 clientCredentials flow')
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: async () => ({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(
        merged[schemeName]!.type === 'oauth2' ? merged[schemeName]!.flows : {},
        'clientCredentials',
        ['user:read'],
        mockServer,
        '',
      )

      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })
      expect(global.fetch).toHaveBeenCalledTimes(1)

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      expect(body.get('audience')).toBe('scalar')
      expect(body.get('grant_type')).toBe('client_credentials')
      expect(body.get('client_id')).toBe('TEST_CLIENT_ID')
      expect(body.get('client_secret')).toBe('TEST_CLIENT_SECRET')
    })

    it('keeps x-scalar-security-body in clientCredentials when refreshUrl is omitted in the input scheme', async () => {
      const documentSlug = 'issue-8516-document-no-refresh'
      const schemeName = 'OAuth2 Bearer'
      const securitySchemes = {
        [schemeName]: {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              scopes: {
                'user:read': 'TEST',
              },
              tokenUrl,
              'x-scalar-security-body': {
                audience: 'scalar',
              },
              'x-scalar-credentials-location': 'body',
            },
          },
        },
      } as unknown as ComponentsObject['securitySchemes']

      const workspaceStore = createWorkspaceStore()
      workspaceStore.auth.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        clientCredentials: {
          'x-scalar-secret-client-id': 'TEST_CLIENT_ID',
          'x-scalar-secret-client-secret': 'TEST_CLIENT_SECRET',
        },
      })

      const merged = mergeSecurity(securitySchemes, {}, workspaceStore.auth, documentSlug)

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: async () => ({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(
        merged[schemeName]!.type === 'oauth2' ? merged[schemeName]!.flows : {},
        'clientCredentials',
        ['user:read'],
        mockServer,
        '',
      )

      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })
      expect(global.fetch).toHaveBeenCalledTimes(1)

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      expect(body.get('audience')).toBe('scalar')
    })
  })

  describe('Implicit Flow', () => {
    const scheme = {
      implicit: {
        ...baseFlow,
        authorizationUrl,
        'x-scalar-secret-redirect-uri': redirectUri,
        'x-scalar-secret-token': '',
      },
    } satisfies OAuthFlowsObjectSecret

    it('should handle successful implicit flow', async () => {
      const promise = authorizeOauth2(scheme, 'implicit', selectedScopes, mockServer, '')
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${scheme.implicit.authorizationUrl}?${new URLSearchParams({
            response_type: 'token',
            redirect_uri: redirectUri,
            client_id: scheme.implicit['x-scalar-secret-client-id'],
            state: state,
            scope: scope.join(' '),
          })}`,
        ),
        'openAuth2Window',
        'left=100,top=100,width=800,height=600',
      )

      // Redirect
      mockWindow.location.href = `${scheme.implicit['x-scalar-secret-redirect-uri']}#access_token=implicit_token_123&state=${state}`

      // Run setInterval
      vi.advanceTimersByTime(200)
      vi.runAllTicks()

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'implicit_token_123' })
    })

    it('should use custom token name when x-tokenName is specified', async () => {
      const flows = {
        implicit: {
          ...scheme.implicit,
          'x-tokenName': 'custom_access_token',
        },
      } satisfies OAuthFlowsObjectSecret

      const promise = authorizeOauth2(flows, 'implicit', selectedScopes, mockServer, '')

      // Redirect with custom token name
      mockWindow.location.href = `${flows.implicit['x-scalar-secret-redirect-uri']}#custom_access_token=custom_implicit_token_123&state=${state}`

      // Run setInterval
      vi.advanceTimersByTime(200)
      vi.runAllTicks()

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'custom_implicit_token_123' })
    })

    it('should handle relative authorization URL in implicit flow', async () => {
      const flows = {
        implicit: {
          ...scheme.implicit,
          authorizationUrl: '/oauth/authorize',
        },
      } satisfies OAuthFlowsObjectSecret

      const promise = authorizeOauth2(flows, 'implicit', selectedScopes, mockServer, '')

      // Test the window.open call uses absolute URL
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${mockServer.url}/oauth/authorize?${new URLSearchParams({
            response_type: 'token',
            redirect_uri: redirectUri,
            client_id: flows.implicit['x-scalar-secret-client-id'],
            state: state,
            scope: scope.join(' '),
          })}`,
        ),
        'openAuth2Window',
        'left=100,top=100,width=800,height=600',
      )

      // Redirect
      mockWindow.location.href = `${flows.implicit['x-scalar-secret-redirect-uri']}#access_token=implicit_token_123&state=${state}`

      // Run setInterval
      vi.advanceTimersByTime(200)
      vi.runAllTicks()

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'implicit_token_123' })
    })
  })

  describe('Password Grant', () => {
    const scheme = {
      password: {
        ...baseFlow,
        tokenUrl,
        'x-scalar-secret-username': 'test-username',
        'x-scalar-secret-password': 'test-password',
        'x-scalar-secret-client-secret': clientSecret,
        'x-scalar-secret-token': '',
      },
    } satisfies OAuthFlowsObjectSecret

    it('should handle successful password flow', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh_token_123',
            scope: scope.join(' '),
          }),
      })

      const [error, result] = await authorizeOauth2(scheme, 'password', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      })

      // Check the server call
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          scope: scope.join(' '),
          grant_type: 'password',
          username: scheme.password['x-scalar-secret-username'],
          password: scheme.password['x-scalar-secret-password'],
        }),
        headers: {
          'Authorization': `Basic ${secretAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })

    it('should include x-scalar-security-body parameters in password flow token request', async () => {
      const flows = {
        password: {
          ...scheme.password,
          'x-scalar-security-body': {
            audience: 'https://api.example.com',
            custom_param: 'custom_value',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'password', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'access_token_123' })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          scope: scope.join(' '),
          grant_type: 'password',
          username: flows.password['x-scalar-secret-username'],
          password: flows.password['x-scalar-secret-password'],
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        }),
        headers: {
          'Authorization': `Basic ${secretAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })

    it('should handle password flow with body-only credentials location', async () => {
      const flows = {
        password: {
          ...scheme.password,
          'x-scalar-credentials-location': 'body',
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh_token_123',
            scope: scope.join(' '),
          }),
      })

      const [error, result] = await authorizeOauth2(flows, 'password', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: expect.any(URLSearchParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      expect(body.toString()).toBe(
        new URLSearchParams({
          scope: scope.join(' '),
          client_id: flows.password['x-scalar-secret-client-id'],
          client_secret: flows.password['x-scalar-secret-client-secret'],
          grant_type: 'password',
          username: flows.password['x-scalar-secret-username'],
          password: flows.password['x-scalar-secret-password'],
        }).toString(),
      )
    })

    it('should handle password flow with body-only credentials and x-scalar-security-body parameters', async () => {
      const flows = {
        password: {
          ...scheme.password,
          'x-scalar-credentials-location': 'body',
          'x-scalar-security-body': {
            audience: 'https://api.example.com',
            custom_param: 'custom_value',
          },
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh_token_123',
            scope: scope.join(' '),
          }),
      })

      const [error, result] = await authorizeOauth2(flows, 'password', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      })

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: expect.any(URLSearchParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      const body = callArgs![1]?.body as URLSearchParams
      expect(body.toString()).toBe(
        new URLSearchParams({
          scope: scope.join(' '),
          client_id: flows.password['x-scalar-secret-client-id'],
          client_secret: flows.password['x-scalar-secret-client-secret'],
          grant_type: 'password',
          username: flows.password['x-scalar-secret-username'],
          password: flows.password['x-scalar-secret-password'],
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        }).toString(),
      )
    })

    it('should handle relative token URL in password flow', async () => {
      const flows = {
        password: {
          ...scheme.password,
          tokenUrl: '/oauth/token',
        },
      } satisfies OAuthFlowsObjectSecret

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh_token_123',
            scope: scope.join(' '),
          }),
      })

      const [error, result] = await authorizeOauth2(flows, 'password', selectedScopes, mockServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      })

      // Test the server call uses absolute URL
      expect(global.fetch).toHaveBeenCalledWith(`${mockServer.url}/oauth/token`, {
        method: 'POST',
        body: new URLSearchParams({
          scope: scope.join(' '),
          grant_type: 'password',
          username: flows.password['x-scalar-secret-username'],
          password: flows.password['x-scalar-secret-password'],
        }),
        headers: {
          'Authorization': `Basic ${secretAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })

    it('should resolve relative token URLs against relative server URLs', async () => {
      const flows = {
        password: {
          ...scheme.password,
          tokenUrl: 'auth/token',
        },
      } satisfies OAuthFlowsObjectSecret
      const relativeServer = {
        ...mockServer,
        url: '/partners',
      } satisfies ServerObject

      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'https://example.com',
          pathname: '/docs',
          href: 'https://example.com/docs',
        },
        writable: true,
      })

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh_token_123',
            scope: scope.join(' '),
          }),
      })

      const [error, result] = await authorizeOauth2(flows, 'password', selectedScopes, relativeServer, '')
      expect(error).toBe(null)
      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      })

      expect(global.fetch).toHaveBeenCalledWith('https://example.com/partners/auth/token', {
        method: 'POST',
        body: new URLSearchParams({
          scope: scope.join(' '),
          grant_type: 'password',
          username: flows.password['x-scalar-secret-username'],
          password: flows.password['x-scalar-secret-password'],
        }),
        headers: {
          'Authorization': `Basic ${secretAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })
  })

  describe('Server variable interpolation', () => {
    it('token URL resolved correctly when server URL contains {variable} — client credentials flow', async () => {
      const flows = {
        clientCredentials: {
          'refreshUrl': 'https://auth.example.com/refresh',
          'scopes': { read: 'Read access' },
          'x-scalar-secret-client-id': 'xxxxx',
          tokenUrl: '/oauth/token',
          'x-scalar-secret-client-secret': clientSecret,
          'x-scalar-secret-token': '',
        },
      } satisfies OAuthFlowsObjectSecret

      const serverWithVars: ServerObject = {
        url: 'https://{environment}.api.example.com',
        variables: { environment: { default: 'prod' } },
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'token_123' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', ['read'], serverWithVars, '')
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'token_123' })

      expect(global.fetch).toHaveBeenCalledWith('https://prod.api.example.com/oauth/token', expect.any(Object))
    })

    it('token URL resolved correctly when server URL contains {variable} — authorization code flow', async () => {
      const flows = {
        authorizationCode: {
          ...baseFlow,
          'x-usePkce': 'no',
          authorizationUrl,
          tokenUrl: '/oauth/token',
          'x-scalar-secret-redirect-uri': redirectUri,
          'x-scalar-secret-client-secret': clientSecret,
          'x-scalar-secret-token': '',
        },
      } satisfies OAuthFlowsObjectSecret

      const serverWithVars: ServerObject = {
        url: 'https://{environment}.api.example.com',
        variables: { environment: { default: 'prod' } },
      }

      const promise = authorizeOauth2(flows, 'authorizationCode', selectedScopes, serverWithVars, '')

      // Mock redirect back from login with authorization code
      mockWindow.location.href = `${redirectUri}?code=auth_code_123&state=${state}`

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'token_prod' }),
      })

      vi.advanceTimersByTime(200)

      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'token_prod' })

      // The token URL should be resolved against the interpolated server URL
      expect(global.fetch).toHaveBeenCalledWith('https://prod.api.example.com/oauth/token', expect.any(Object))
    })

    it('relative redirect URI resolved against the interpolated server URL', () => {
      const flows = {
        implicit: {
          ...baseFlow,
          authorizationUrl,
          'x-scalar-secret-redirect-uri': '/callback',
          'x-scalar-secret-token': '',
        },
      } satisfies OAuthFlowsObjectSecret

      const serverWithVars: ServerObject = {
        url: 'https://{tenant}.example.com',
        variables: { tenant: { default: 'myorg' } },
      }

      void authorizeOauth2(flows, 'implicit', selectedScopes, serverWithVars, '')

      const firstArgs = vi.mocked(window.open).mock.calls[0]
      const openedUrl = firstArgs?.[0] as URL
      expect(openedUrl.searchParams.get('redirect_uri')).toBe('https://myorg.example.com/callback')
    })

    it('token URL resolved via environment variables — client credentials flow', async () => {
      const flows = {
        clientCredentials: {
          'refreshUrl': 'https://auth.example.com/refresh',
          'scopes': { read: 'Read access' },
          'x-scalar-secret-client-id': 'xxxxx',
          tokenUrl: '/oauth/token',
          'x-scalar-secret-client-secret': clientSecret,
          'x-scalar-secret-token': '',
        },
      } satisfies OAuthFlowsObjectSecret

      const server: ServerObject = {
        url: '{protocol}://void.scalar.com/{path}',
        variables: { protocol: { default: 'https' }, path: { default: '' } },
      }
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'token_env' }),
      })

      const [error, result] = await authorizeOauth2(flows, 'clientCredentials', ['read'], server, '', {})
      expect(error).toBe(null)
      expect(result).toEqual({ accessToken: 'token_env' })

      expect(global.fetch).toHaveBeenCalledWith('https://void.scalar.com/oauth/token', expect.any(Object))
    })
  })
})
