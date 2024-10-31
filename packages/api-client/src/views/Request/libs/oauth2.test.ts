import type {
  SecuritySchemeOauth2,
  SecuritySchemeOauth2ExampleValue,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authorizeOauth2, authorizeServers } from './oauth2'

const baseScheme: Pick<
  SecuritySchemeOauth2,
  'uid' | 'nameKey' | 'type' | 'x-scalar-client-id'
> = {
  'uid': 'test-scheme',
  'nameKey': 'test-name-key',
  'type': 'oauth2',
  'x-scalar-client-id': 'client123',
}

const baseFlow: Pick<
  SecuritySchemeOauth2['flow'],
  'refreshUrl' | 'scopes' | 'selectedScopes'
> = {
  refreshUrl: 'https://auth.example.com/refresh',
  scopes: {
    read: 'Read access',
    write: 'Write access',
  },
  selectedScopes: ['read', 'write'],
}

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
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  const mockServer: Server = {
    uid: 'test-server',
    url: 'https://api.example.com',
  }

  // describe('Authorization Code Grant', () => {
  //   const scheme: SecuritySchemeOauth2 = {
  //     'uid': 'test-scheme',
  //     'nameKey': 'test-name-key',
  //     'type': 'oauth2',
  //     'flow': {
  //       'refreshUrl': 'https://auth.example.com/refresh',
  //       'type': 'authorizationCode',
  //       'authorizationUrl': 'https://auth.example.com/authorize',
  //       'tokenUrl': 'https://auth.example.com/token',
  //       'scopes': {
  //         read: 'Read access',
  //         write: 'Write access',
  //       },
  //       'x-scalar-redirect-uri': 'https://callback.example.com',
  //       'selectedScopes': ['read', 'write'],
  //     },
  //     'x-scalar-client-id': 'client123',
  //   }

  //   const example = {
  //     type: 'oauth-authorization-code',
  //     clientSecret: 'secret123',
  //   }

  //   it('should handle successful authorization code flow', async () => {
  //     // Mock the auth window interaction
  //     setTimeout(() => {
  //       mockWindow.location.href =
  //         'https://callback.example.com?code=auth_code_123&state=mock_state'
  //     }, 100)

  //     // Mock the token exchange
  //     global.fetch = vi.fn().mockResolvedValueOnce({
  //       json: () => Promise.resolve({ access_token: 'access_token_123' }),
  //     })

  //     const result = await authorizeOauth2(scheme, example, mockServer)

  //     expect(result).toBe('access_token_123')
  //     expect(window.open).toHaveBeenCalledWith(
  //       expect.stringContaining('https://auth.example.com/authorize'),
  //       'openAuth2Window',
  //       expect.any(String),
  //     )
  //     expect(global.fetch).toHaveBeenCalledWith(
  //       'https://auth.example.com/token',
  //       expect.objectContaining({
  //         method: 'POST',
  //         headers: expect.objectContaining({
  //           'Content-Type': 'application/x-www-form-urlencoded',
  //           'Authorization': expect.any(String),
  //         }),
  //       }),
  //     )
  //   })

  //   it('should handle window closure before authorization', async () => {
  //     setTimeout(() => {
  //       mockWindow.closed = true
  //     }, 100)

  //     await expect(
  //       authorizeOauth2(scheme, example, mockServer),
  //     ).rejects.toThrow('Window was closed without granting authorization')
  //   })
  // })

  // describe('Client Credentials Grant', () => {
  //   const scheme: SecuritySchemeOauth2 = {
  //     'type': 'oauth2',
  //     'flow': {
  //       type: 'clientCredentials',
  //       tokenUrl: 'https://auth.example.com/token',
  //       selectedScopes: ['read', 'write'],
  //     },
  //     'x-scalar-client-id': 'client123',
  //   }

  //   const example = {
  //     type: 'oauth-client-credentials',
  //     clientSecret: 'secret123',
  //   }

  //   it('should handle successful client credentials flow', async () => {
  //     global.fetch = vi.fn().mockResolvedValueOnce({
  //       json: () => Promise.resolve({ access_token: 'access_token_123' }),
  //     })
  //     const result = await authorizeOauth2(scheme, example, mockServer)

  //     expect(result).toBe('access_token_123')
  //     expect(global.fetch).toHaveBeenCalledWith(
  //       'https://auth.example.com/token',
  //       expect.objectContaining({
  //         method: 'POST',
  //         body: expect.stringContaining('grant_type=client_credentials'),
  //       }),
  //     )
  //   })

  //   it('should handle token request failure', async () => {
  //     global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

  //     await expect(
  //       authorizeOauth2(scheme, example, mockServer),
  //     ).rejects.toThrow('Failed to get an access token')
  //   })
  // })

  describe('Implicit Flow', () => {
    const scheme: SecuritySchemeOauth2 & { flow: { type: 'implicit' } } = {
      ...baseScheme,
      flow: {
        ...baseFlow,
        'type': 'implicit',
        'authorizationUrl': 'https://auth.example.com/authorize',
        'x-scalar-redirect-uri': 'https://callback.example.com',
      },
    }
    const example: SecuritySchemeOauth2ExampleValue & {
      type: 'oauth-implicit'
    } = {
      type: 'oauth-implicit',
      token: '',
    }

    it('should handle successful implicit flow', async () => {
      const state = '82mvz'
      vi.spyOn(Math, 'random').mockReturnValue(0.123456) // For predictable state
      const promise = authorizeOauth2(scheme, example, mockServer)

      // Redirect
      mockWindow.location.href = `${scheme.flow['x-scalar-redirect-uri']}#access_token=implicit_token_123&state=${state}`

      // Run setInterval
      vi.advanceTimersByTime(200)
      await vi.runAllTicks()

      // Resolve
      const result = await promise

      expect(window.open).toHaveBeenCalledWith(
        new URL(
          `${scheme.flow.authorizationUrl}?response_type=token&redirect_uri=https%3A%2F%2Fcallback.example.com&client_id=client123&scope=read+write&state=${state}`,
        ),
        'openAuth2Window',
        'left=100,top=100,width=800,height=600',
      )
      expect(result).toBe('implicit_token_123')
    })
  })

  describe('Password Grant', () => {
    const scheme: SecuritySchemeOauth2 & { flow: { type: 'password' } } = {
      ...baseScheme,
      type: 'oauth2',
      flow: {
        ...baseFlow,
        type: 'password',
        tokenUrl: 'https://auth.example.com/token',
      },
    }
    const example: SecuritySchemeOauth2ExampleValue & {
      type: 'oauth-password'
    } = {
      token: '',
      clientSecret: 'secret123',
      type: 'oauth-password',
      username: 'test-username',
      password: 'test-password',
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
            scope: 'read write',
          }),
      })

      const result = await authorizeOauth2(scheme, example, mockServer)
      expect(result).toBe('access_token_123')

      // Check the server call
      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth.example.com/token',
        {
          method: 'POST',
          body: new URLSearchParams({
            client_id: scheme['x-scalar-client-id'],
            scope: 'read write',
            client_secret: example.clientSecret,
            grant_type: 'password',
            username: example.username,
            password: example.password,
          }),
          headers: {
            'Authorization': `Basic ${btoa(`${scheme['x-scalar-client-id']}:${example.clientSecret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
    })
  })

  // Tests for relative redirect URIs
  // describe('Relative Redirect URIs', () => {
  //   const scheme: SecuritySchemeOauth2 = {
  //     'type': 'oauth2',
  //     'flow': {
  //       'type': 'authorizationCode',
  //       'authorizationUrl': 'https://auth.example.com/authorize',
  //       'tokenUrl': 'https://auth.example.com/token',
  //       'x-scalar-redirect-uri': '/callback',
  //       'selectedScopes': ['read'],
  //     },
  //     'x-scalar-client-id': 'client123',
  //   }

  //   const example = {
  //     type: 'oauth-authorization-code',
  //     clientSecret: 'secret123',
  //   }

  //   it('should handle relative redirect URIs', async () => {
  //     const mockServer: Server = {
  //       url: 'https://myapp.example.com',
  //     }

  //     setTimeout(() => {
  //       mockWindow.closed = true
  //     }, 100)

  //     try {
  //       await authorizeOauth2(scheme, example, mockServer)
  //     } catch (e) {
  //       // We expect an error since we're closing the window
  //     }

  //     expect(window.open).toHaveBeenCalledWith(
  //       expect.stringContaining(
  //         'redirect_uri=https%3A%2F%2Fmyapp.example.com%2Fcallback',
  //       ),
  //       expect.any(String),
  //       expect.any(String),
  //     )
  //   })
  // })

  // describe('PKCE Flow', () => {
  //   const scheme: SecuritySchemeOauth2 = {
  //     'type': 'oauth2',
  //     'flow': {
  //       'type': 'authorizationCodeWithPKCE',
  //       'authorizationUrl': 'https://auth.example.com/authorize',
  //       'tokenUrl': 'https://auth.example.com/token',
  //       'x-scalar-redirect-uri': 'https://callback.example.com',
  //       'selectedScopes': ['read', 'write'],
  //     },
  //     'x-scalar-client-id': 'client123',
  //   }

  //   const example = {
  //     type: 'oauth-pkce',
  //     clientId: 'client123',
  //   }

  //   it('should generate valid PKCE code verifier and challenge', async () => {
  //     const mockCodeVerifier = 'mock_code_verifier_random_string'
  //     const mockCodeChallenge = 'mock_code_challenge_base64url'

  //     vi.spyOn(crypto, 'getRandomValues').mockImplementation(
  //       () => new Uint8Array([1, 2, 3]),
  //     )
  //     vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(
  //       new Uint8Array([4, 5, 6]).buffer,
  //     )

  //     setTimeout(() => {
  //       mockWindow.location.href = `https://callback.example.com?code=pkce_auth_code_123&state=mock_state`
  //     }, 100)

  //     global.fetch = vi.fn().mockResolvedValueOnce({
  //       json: () => Promise.resolve({ access_token: 'pkce_access_token_123' }),
  //     })

  //     const result = await authorizeOauth2(scheme, example, mockServer)

  //     expect(result).toBe('pkce_access_token_123')
  //     expect(window.open).toHaveBeenCalledWith(
  //       expect.stringContaining('code_challenge_method=S256'),
  //       'openAuth2Window',
  //       expect.any(String),
  //     )
  //     expect(global.fetch).toHaveBeenCalledWith(
  //       'https://auth.example.com/token',
  //       expect.objectContaining({
  //         body: expect.stringContaining('code_verifier='),
  //       }),
  //     )
  //   })
  // })

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
