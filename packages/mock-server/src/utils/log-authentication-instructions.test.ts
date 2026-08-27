import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { logAuthenticationInstructions } from './log-authentication-instructions'

describe('logAuthenticationInstructions', () => {
  // The spies replace the global console, so restore them even when an assertion throws first.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints nothing without security schemes', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    logAuthenticationInstructions({})

    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('prints the instructions for a bearer token scheme', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    logAuthenticationInstructions({ bearer: { type: 'http', scheme: 'bearer' } })

    expect(consoleLogSpy).toHaveBeenCalledWith('Authentication:')
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Bearer Token Authentication')
    expect(consoleLogSpy).toHaveBeenCalledWith('   Authorization: Bearer YOUR_TOKEN_HERE')
  })

  it('prints the authorization URL next to the method', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    logAuthenticationInstructions({
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
    })

    // The only line that passes two arguments, so it is the one a refactor is most likely to break.
    expect(consoleLogSpy).toHaveBeenCalledWith('   GET', '/oauth/authorize?redirect_uri=https://YOUR_REDIRECT_URI_HERE')
  })

  it('prints no instructions when quiet is enabled', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    logAuthenticationInstructions({ bearer: { type: 'http', scheme: 'bearer' } }, { quiet: true })

    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  describe('diagnostics survive a quiet startup', () => {
    it.each([
      ['an unsupported API key location', { type: 'apiKey', name: 'X-API-Key', in: 'body' }],
      ['an unknown HTTP scheme', { type: 'http', scheme: 'digest' }],
    ])('reports %s', (_, scheme) => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      logAuthenticationInstructions({ scheme: scheme as OpenAPIV3_1.SecuritySchemeObject }, { quiet: true })

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
    })

    it.each([
      ['an unsupported OAuth 2.0 flow', { type: 'oauth2', flows: { deviceAuthorization: {} } }],
      ['an unknown scheme type', { type: 'mutualTLS' }],
    ])('reports %s', (_, scheme) => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      logAuthenticationInstructions({ scheme: scheme as OpenAPIV3_1.SecuritySchemeObject }, { quiet: true })

      expect(consoleWarnSpy).toHaveBeenCalledOnce()
    })
  })
})
