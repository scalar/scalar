import { securityOauthSchema, serverSchema } from '@scalar/oas-utils/entities/spec'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authorizeOauth2 } from './oauth2'

const baseScheme = {
  uid: 'test-scheme',
  nameKey: 'test-name-key',
  type: 'oauth2',
}

const baseFlow = {
  'refreshUrl': 'https://auth.example.com/refresh',
  'scopes': {
    read: 'Read access',
    write: 'Write access',
  },
  'selectedScopes': ['read', 'write'],
  'x-scalar-client-id': 'xxxxx',
}

const scope = Object.keys(baseFlow.scopes)
const authorizationUrl = 'https://auth.example.com/authorize'
const tokenUrl = 'https://auth.example.com/token'
const redirectUri = 'https://callback.example.com'
const clientSecret = 'yyyyy'
const secretAuth = btoa(`${baseFlow['x-scalar-client-id']}:${clientSecret}`)

const windowTarget = 'openAuth2Window'
const windowFeatures = 'left=100,top=100,width=800,height=600'

/** This state corresponds to Math.random() === 0.123456 */
const state = '4fzyo82m'
const randomVal = 0.123456

describe('oauth2', () => {
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

  const mockServer = serverSchema.parse({
    uid: 'test-server',
    url: 'https://api.example.com',
  })

  describe('Authorization Code Grant', () => {
    const scheme = securityOauthSchema.parse({
      ...baseScheme,
      type: 'oauth2',
      flows: {
        authorizationCode: {
          ...baseFlow,
          'x-usePkce': 'no',
          'type': 'authorizationCode',
          authorizationUrl,
          tokenUrl,
          'token': '',
          clientSecret,
          'x-scalar-redirect-uri': redirectUri,
        },
      },
    })
    const flow = scheme.flows.authorizationCode
    if (!flow) {
      throw new Error('Flow is undefined')
    }

    it('should handle successful authorization code flow', async () => {
      const promise = authorizeOauth2(flow, mockServer)
      const accessToken = 'access_token_123'

      // Test the window.open call
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${flow.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            redirect_uri: flow['x-scalar-redirect-uri'],
            client_id: flow['x-scalar-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )

      // Mock redirect back from login
      mockWindow.location.href = `${flow['x-scalar-redirect-uri']}?code=auth_code_123&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toBe(accessToken)

      // Test the server call
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: flow['x-scalar-client-id'],
          client_secret: flow.clientSecret,
          redirect_uri: flow['x-scalar-redirect-uri'],
          code: 'auth_code_123',
          grant_type: 'authorization_code',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })
    })

    // PKCE
    it('should generate valid PKCE code verifier and challenge using SHA-256 encryption', async () => {
      const _flow = {
        ...flow,
        'x-usePkce': 'SHA-256',
        'x-scalar-security-query': {
          prompt: 'login',
          audience: 'scalar',
        },
      } as const

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

      const promise = authorizeOauth2(_flow, mockServer)
      await flushPromises()

      // Test the window.open call
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${_flow.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            redirect_uri: _flow['x-scalar-redirect-uri'],
            prompt: 'login',
            audience: 'scalar',
            client_id: _flow['x-scalar-client-id'],
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
      expect(result).toBe(accessToken)

      // Check fetch parameters
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
        body: new URLSearchParams({
          client_id: _flow['x-scalar-client-id'],
          client_secret: _flow.clientSecret,
          redirect_uri: _flow['x-scalar-redirect-uri'],
          code,
          grant_type: 'authorization_code',
          code_verifier: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8',
        }),
      })
    })

    it('should include x-scalar-security-body parameters in authorization code token request', async () => {
      const customFlow = {
        ...flow,
        'x-scalar-security-body': {
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        },
      } as const

      const promise = authorizeOauth2(customFlow, mockServer)
      const accessToken = 'access_token_123'
      const code = 'auth_code_123'

      // Mock redirect back from login
      mockWindow.location.href = `${customFlow['x-scalar-redirect-uri']}?code=${code}&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toBe(accessToken)

      // Test the server call includes custom body parameters
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: customFlow['x-scalar-client-id'],
          client_secret: customFlow.clientSecret,
          redirect_uri: customFlow['x-scalar-redirect-uri'],
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
      const promise = authorizeOauth2(flow, mockServer)

      mockWindow.closed = true
      vi.advanceTimersByTime(200)

      const [error, result] = await promise
      expect(result).toBe(null)
      expect(error).toBeInstanceOf(Error)
      expect(error!.message).toBe('Window was closed without granting authorization')
    })

    // Test relative redirect URIs
    it('should handle relative redirect URIs', async () => {
      const _flow = {
        ...flow,
        'x-scalar-redirect-uri': '/callback',
      } as const
      authorizeOauth2(_flow, mockServer)

      // Test the window.open call for full redirect
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${_flow.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            redirect_uri: `${mockServer.url}/callback`,
            client_id: _flow['x-scalar-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )
    })

    // State mismatch
    it('blow up on state mismatch', async () => {
      const promise = authorizeOauth2(flow, mockServer)

      // Mock redirect with bad state
      mockWindow.location.href = `${flow['x-scalar-redirect-uri']}?code=auth_code_123&state=bad_state`
      vi.advanceTimersByTime(200)

      const [error, result] = await promise
      expect(result).toBe(null)
      expect(error).toBeInstanceOf(Error)
      expect(error!.message).toBe('State mismatch')
    })

    it('should use the proxy if provided', async () => {
      const promise = authorizeOauth2(flow, mockServer, 'https://proxy.example.com')

      const accessToken = 'access_token_123'

      // Test the window.open call
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${flow.authorizationUrl}?${new URLSearchParams({
            response_type: 'code',
            redirect_uri: flow['x-scalar-redirect-uri'],
            client_id: flow['x-scalar-client-id'],
            state: state,
            scope: scope.join(' '),
          }).toString()}`,
        ),
        windowTarget,
        windowFeatures,
      )

      // Mock redirect back from login
      mockWindow.location.href = `${flow['x-scalar-redirect-uri']}?code=auth_code_123&state=${state}`

      // Mock the token exchange
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: accessToken }),
      })

      // Run setInterval
      vi.advanceTimersByTime(200)

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toBe(accessToken)

      // Test the server call
      expect(global.fetch).toHaveBeenCalledWith(
        'https://proxy.example.com?scalar_url=https%3A%2F%2Fauth.example.com%2Ftoken',
        {
          method: 'POST',
          body: new URLSearchParams({
            client_id: flow['x-scalar-client-id'],
            client_secret: flow.clientSecret,
            redirect_uri: flow['x-scalar-redirect-uri'],
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
  })

  describe('Client Credentials Grant', () => {
    const scheme = securityOauthSchema.parse({
      ...baseScheme,
      flows: {
        clientCredentials: {
          ...baseFlow,
          type: 'clientCredentials',
          tokenUrl,
          clientSecret,
          token: '',
        },
      },
    })
    const flow = scheme.flows.clientCredentials
    if (!flow) {
      throw new Error('Flow is undefined')
    }

    it('should handle successful client credentials flow', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(flow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: flow['x-scalar-client-id'],
          scope: scope.join(' '),
          client_secret: flow.clientSecret,
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
      const [error, result] = await authorizeOauth2(flow, mockServer)
      expect(result).toBe(null)
      expect(error).toBeInstanceOf(Error)
      expect(error!.message).toBe('Failed to get an access token. Please check your credentials.')
    })

    it('should use custom token name when x-tokenName is specified', async () => {
      const customFlow = {
        ...flow,
        'x-tokenName': 'custom_access_token',
      } as const

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ custom_access_token: 'custom_token_123' }),
      })

      const [error, result] = await authorizeOauth2(customFlow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('custom_token_123')
    })

    it('should include x-scalar-security-body parameters in token request', async () => {
      const customFlow = {
        ...flow,
        'x-scalar-security-body': {
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        },
      } as const

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(customFlow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: customFlow['x-scalar-client-id'],
          scope: scope.join(' '),
          client_secret: customFlow.clientSecret,
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

    it('should handle client credentials flow with header-only credentials location', async () => {
      const _flow = {
        ...flow,
        'x-scalar-credentials-location': 'header',
      } as const

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(_flow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: _flow['x-scalar-client-id'],
          scope: scope.join(' '),
          grant_type: 'client_credentials',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${secretAuth}`,
        },
      })
    })

    it('should handle client credentials flow with body-only credentials location', async () => {
      const _flow = {
        ...flow,
        'x-scalar-credentials-location': 'body',
      } as const

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(_flow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: _flow['x-scalar-client-id'],
          scope: scope.join(' '),
          client_secret: _flow.clientSecret,
          grant_type: 'client_credentials',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })
  })

  describe('Implicit Flow', () => {
    const scheme = securityOauthSchema.parse({
      ...baseScheme,
      flows: {
        implicit: {
          ...baseFlow,
          'type': 'implicit',
          authorizationUrl,
          'x-scalar-redirect-uri': redirectUri,
          'token': '',
        },
      },
    })
    const flow = scheme.flows.implicit
    if (!flow) {
      throw new Error('Flow is undefined')
    }

    it('should handle successful implicit flow', async () => {
      const promise = authorizeOauth2(flow, mockServer)
      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${flow.authorizationUrl}?${new URLSearchParams({
            response_type: 'token',
            redirect_uri: redirectUri,
            client_id: flow['x-scalar-client-id'],
            state: state,
            scope: scope.join(' '),
          })}`,
        ),
        'openAuth2Window',
        'left=100,top=100,width=800,height=600',
      )

      // Redirect
      mockWindow.location.href = `${flow['x-scalar-redirect-uri']}#access_token=implicit_token_123&state=${state}`

      // Run setInterval
      vi.advanceTimersByTime(200)
      vi.runAllTicks()

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toBe('implicit_token_123')
    })

    it('should use custom token name when x-tokenName is specified', async () => {
      const customFlow = {
        ...flow,
        'x-tokenName': 'custom_access_token',
      } as const

      const promise = authorizeOauth2(customFlow, mockServer)

      // Redirect with custom token name
      mockWindow.location.href = `${customFlow['x-scalar-redirect-uri']}#custom_access_token=custom_implicit_token_123&state=${state}`

      // Run setInterval
      vi.advanceTimersByTime(200)
      vi.runAllTicks()

      // Resolve
      const [error, result] = await promise
      expect(error).toBe(null)
      expect(result).toBe('custom_implicit_token_123')
    })
  })

  describe('Password Grant', () => {
    const scheme = securityOauthSchema.parse({
      ...baseScheme,
      type: 'oauth2',
      flows: {
        password: {
          ...baseFlow,
          type: 'password',
          tokenUrl,
          clientSecret,
          username: 'test-username',
          password: 'test-password',
          token: '',
        },
      },
    })
    const flow = scheme.flows.password
    if (!flow) {
      throw new Error('Flow is undefined')
    }

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

      const [error, result] = await authorizeOauth2(flow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      // Check the server call
      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: flow['x-scalar-client-id'],
          scope: scope.join(' '),
          client_secret: flow.clientSecret,
          grant_type: 'password',
          username: flow.username,
          password: flow.password,
        }),
        headers: {
          'Authorization': `Basic ${secretAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })

    it('should include x-scalar-security-body parameters in password flow token request', async () => {
      const customFlow = {
        ...flow,
        'x-scalar-security-body': {
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        },
      } as const

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'access_token_123' }),
      })

      const [error, result] = await authorizeOauth2(customFlow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: customFlow['x-scalar-client-id'],
          scope: scope.join(' '),
          client_secret: customFlow.clientSecret,
          grant_type: 'password',
          username: customFlow.username,
          password: customFlow.password,
          audience: 'https://api.example.com',
          custom_param: 'custom_value',
        }),
        headers: {
          'Authorization': `Basic ${secretAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })

    it('should handle password flow with header-only credentials location', async () => {
      const _flow = {
        ...flow,
        'x-scalar-credentials-location': 'header',
      } as const

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

      const [error, result] = await authorizeOauth2(_flow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: _flow['x-scalar-client-id'],
          scope: scope.join(' '),
          grant_type: 'password',
          username: _flow.username,
          password: _flow.password,
        }),
        headers: {
          'Authorization': `Basic ${secretAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })

    it('should handle password flow with body-only credentials location', async () => {
      const _flow = {
        ...flow,
        'x-scalar-credentials-location': 'body',
      } as const

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

      const [error, result] = await authorizeOauth2(_flow, mockServer)
      expect(error).toBe(null)
      expect(result).toBe('access_token_123')

      expect(global.fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: _flow['x-scalar-client-id'],
          scope: scope.join(' '),
          client_secret: _flow.clientSecret,
          grant_type: 'password',
          username: _flow.username,
          password: _flow.password,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    })
  })

  // Device code is coming in openapi spec 3.2.0
  // If anyone needs it before we can add it
  // describe('Device Code Flow', () => {
  //   const scheme: SecuritySchemeOauth2 = {
  //     'type': 'oauth2',
  //     'flow': {
  //       type: 'deviceCode',
  //       deviceAuthorizationUrl: 'https://auth.example.com/device/code',
  //       tokenUrl: 'https://auth.example.com/token',
  //       selectedScopes: ['read', 'write'],
  //     },
  //     'x-scalar-client-id': 'client123',
  //   }

  //   const example = {
  //     type: 'oauth-device',
  //     clientId: 'client123',
  //   }

  //   it('should handle successful device code flow', async () => {
  //     // Mock device code request
  //     global.fetch = vi
  //       .fn()
  //       .mockResolvedValueOnce({
  //         json: () =>
  //           Promise.resolve({
  //             device_code: 'device_code_123',
  //             user_code: 'USER-CODE-123',
  //             verification_uri: 'https://auth.example.com/activate',
  //             verification_uri_complete:
  //               'https://auth.example.com/activate?code=USER-CODE-123',
  //             interval: 5,
  //           }),
  //       })
  //       // Mock token polling requests
  //       .mockResolvedValueOnce({
  //         json: () => Promise.resolve({ error: 'authorization_pending' }),
  //       })
  //       .mockResolvedValueOnce({
  //         json: () =>
  //           Promise.resolve({ access_token: 'device_access_token_123' }),
  //       })

  //     const result = await authorizeOauth2(scheme, example, mockServer)

  //     expect(result).toBe('device_access_token_123')
  //     expect(global.fetch).toHaveBeenNthCalledWith(
  //       1,
  //       'https://auth.example.com/device/code',
  //       expect.objectContaining({
  //         method: 'POST',
  //         body: expect.stringContaining('client_id=client123'),
  //       }),
  //     )
  //     expect(global.fetch).toHaveBeenLastCalledWith(
  //       'https://auth.example.com/token',
  //       expect.objectContaining({
  //         body: expect.stringContaining(
  //           'grant_type=urn:ietf:params:oauth:grant-type:device_code',
  //         ),
  //       }),
  //     )
  //   })

  //   it('should handle device flow timeout', async () => {
  //     global.fetch = vi
  //       .fn()
  //       .mockResolvedValueOnce({
  //         json: () =>
  //           Promise.resolve({
  //             device_code: 'device_code_123',
  //             user_code: 'USER-CODE-123',
  //             verification_uri: 'https://auth.example.com/activate',
  //             interval: 5,
  //             expires_in: 1,
  //           }),
  //       })
  //       .mockResolvedValue({
  //         json: () => Promise.resolve({ error: 'authorization_pending' }),
  //       })

  //     await expect(
  //       authorizeOauth2(scheme, example, mockServer),
  //     ).rejects.toThrow('Device code expired')
  //   })
  // })

  // describe('Refresh Token Flow', () => {
  //   const scheme: SecuritySchemeOauth2 = {
  //     'type': 'oauth2',
  //     'flow': {
  //       'type': 'authorizationCode',
  //       'authorizationUrl': 'https://auth.example.com/authorize',
  //       'tokenUrl': 'https://auth.example.com/token',
  //       'x-scalar-redirect-uri': 'https://callback.example.com',
  //       'selectedScopes': ['read', 'write'],
  //     },
  //     'x-scalar-client-id': 'client123',
  //   }

  //   const example = {
  //     type: 'oauth-refresh-token',
  //     clientId: 'client123',
  //     clientSecret: 'secret123',
  //     refreshToken: 'refresh_token_123',
  //   }

  //   it('should handle successful refresh token exchange', async () => {
  //     global.fetch = vi.fn().mockResolvedValueOnce({
  //       json: () =>
  //         Promise.resolve({
  //           access_token: 'new_access_token_123',
  //           refresh_token: 'new_refresh_token_123',
  //         }),
  //     })

  //     const result = await authorizeOauth2(scheme, example, mockServer)

  //     expect(result).toBe('new_access_token_123')
  //     expect(global.fetch).toHaveBeenCalledWith(
  //       'https://auth.example.com/token',
  //       expect.objectContaining({
  //         method: 'POST',
  //         body: expect.stringContaining('grant_type=refresh_token'),
  //         body: expect.stringContaining('refresh_token=refresh_token_123'),
  //       }),
  //     )
  //   })

  //   it('should handle expired refresh token', async () => {
  //     global.fetch = vi.fn().mockResolvedValueOnce({
  //       status: 400,
  //       json: () =>
  //         Promise.resolve({
  //           error: 'invalid_grant',
  //           error_description: 'Refresh token expired',
  //         }),
  //     })

  //     await expect(
  //       authorizeOauth2(scheme, example, mockServer),
  //     ).rejects.toThrow('Refresh token expired')
  //   })

  //   it('should handle refresh token rotation', async () => {
  //     global.fetch = vi.fn().mockResolvedValueOnce({
  //       json: () =>
  //         Promise.resolve({
  //           access_token: 'rotated_access_token_123',
  //           refresh_token: 'rotated_refresh_token_123',
  //         }),
  //     })

  //     const result = await authorizeOauth2(scheme, example, mockServer)

  //     expect(result).toBe('rotated_access_token_123')
  //     // Verify the new refresh token is stored/handled appropriately
  //     expect(example.refreshToken).toBe('rotated_refresh_token_123')
  //   })
  // })
})
