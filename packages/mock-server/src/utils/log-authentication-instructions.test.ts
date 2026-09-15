import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { logAuthenticationInstructions } from './log-authentication-instructions'

describe('logAuthenticationInstructions', () => {
  // Some tests spy on the global console, so restore it even when an assertion throws first.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints nothing without security schemes', () => {
    const log = vi.fn()

    logAuthenticationInstructions({}, log)

    expect(log).not.toHaveBeenCalled()
  })

  it('prints the instructions for a bearer token scheme', () => {
    const log = vi.fn()

    logAuthenticationInstructions({ bearer: { type: 'http', scheme: 'bearer' } }, log)

    expect(log).toHaveBeenCalledWith('Authentication:')
    expect(log).toHaveBeenCalledWith('✅ Bearer Token Authentication')
    expect(log).toHaveBeenCalledWith('   Authorization: Bearer YOUR_TOKEN_HERE')
  })

  it('prints the authorization URL next to the method', () => {
    const log = vi.fn()

    logAuthenticationInstructions(
      {
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {},
            },
          },
        },
      },
      log,
    )

    expect(log).toHaveBeenCalledWith('   GET /oauth/authorize?redirect_uri=https://YOUR_REDIRECT_URI_HERE')
  })

  it('routes the instructions through the provided logger instead of the console', () => {
    const log = vi.fn()
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    logAuthenticationInstructions({ bearer: { type: 'http', scheme: 'bearer' } }, log)

    expect(log).toHaveBeenCalled()
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  describe('diagnostics print regardless of the logger', () => {
    it.each([
      {
        name: 'an unsupported API key location',
        scheme: { type: 'apiKey', name: 'X-API-Key', in: 'body' },
        expected: ['❌ Unsupported API Key Location: body'],
      },
      {
        name: 'an unknown HTTP scheme',
        scheme: { type: 'http', scheme: 'digest' },
        expected: ['❌ Unknown Security Scheme:', { type: 'http', scheme: 'digest' }],
      },
    ])('reports $name', ({ scheme, expected }) => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      logAuthenticationInstructions({ scheme: scheme as OpenAPIV3_1.SecuritySchemeObject }, () => undefined)

      expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith(...expected)
    })

    it.each([
      {
        name: 'an unsupported OAuth 2.0 flow',
        scheme: { type: 'oauth2', flows: { deviceAuthorization: {} } },
        expected: 'Unsupported OAuth 2.0 flow: deviceAuthorization',
      },
      {
        name: 'an unknown scheme type',
        scheme: { type: 'mutualTLS' },
        expected: 'Unsupported security scheme type: mutualTLS',
      },
    ])('reports $name', ({ scheme, expected }) => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      logAuthenticationInstructions({ scheme: scheme as OpenAPIV3_1.SecuritySchemeObject }, () => undefined)

      expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith(expected)
    })
  })
})
