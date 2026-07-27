import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runOAuth2Authorize, storeOAuth2Tokens } from './run-oauth2-authorize'

// authorizeOauth2 is mocked so the helper's token-routing is tested without a real OAuth round-trip.
vi.mock('./oauth', () => ({ authorizeOauth2: vi.fn() }))

import { authorizeOauth2 } from './oauth'

const baseFlows = {
  authorizationCode: {
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    refreshUrl: '',
    'x-usePkce': 'no',
    scopes: { openid: '', profile: '' },
    'x-scalar-secret-client-id': 'client',
    'x-scalar-secret-redirect-uri': '',
  },
} as never

const environment = { variables: [] } as never

describe('runOAuth2Authorize', () => {
  const emit = vi.fn()
  const eventBus = { emit } as unknown as WorkspaceEventBus

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes the access token to the bearer scheme and the refresh token to oauth2', async () => {
    vi.mocked(authorizeOauth2).mockResolvedValue([null, { accessToken: 'acc', refreshToken: 'ref' }])

    const [error, tokens] = await runOAuth2Authorize({
      eventBus,
      bearerSchemeName: 'BearerAuth',
      oauth2Name: 'OAuth2',
      flows: baseFlows,
      flowType: 'authorizationCode',
      scopes: ['openid'],
      server: null,
      proxyUrl: '',
      environment,
    })

    expect(error).toBeNull()
    expect(tokens).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
    // access token → bearer scheme (sent as Authorization: Bearer)
    expect(emit).toHaveBeenCalledWith('auth:update:security-scheme-secrets', {
      payload: { type: 'http', 'x-scalar-secret-token': 'acc' },
      name: 'BearerAuth',
    })
    // refresh token → oauth2 scheme (the only thing that knows how to refresh)
    expect(emit).toHaveBeenCalledWith('auth:update:security-scheme-secrets', {
      payload: {
        type: 'oauth2',
        authorizationCode: { 'x-scalar-secret-refresh-token': 'ref' },
      },
      name: 'OAuth2',
    })
  })

  it('omits the refresh emit when the flow returns no refresh token', async () => {
    vi.mocked(authorizeOauth2).mockResolvedValue([null, { accessToken: 'acc' }])

    await runOAuth2Authorize({
      eventBus,
      bearerSchemeName: 'BearerAuth',
      oauth2Name: 'OAuth2',
      flows: baseFlows,
      flowType: 'authorizationCode',
      scopes: [],
      server: null,
      proxyUrl: '',
      environment,
    })

    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('auth:update:security-scheme-secrets', {
      payload: { type: 'http', 'x-scalar-secret-token': 'acc' },
      name: 'BearerAuth',
    })
  })

  it('does not store secrets when authorization fails', async () => {
    vi.mocked(authorizeOauth2).mockResolvedValue([new Error('denied'), null])

    const [error, tokens] = await runOAuth2Authorize({
      eventBus,
      bearerSchemeName: 'BearerAuth',
      oauth2Name: 'OAuth2',
      flows: baseFlows,
      flowType: 'authorizationCode',
      scopes: [],
      server: null,
      proxyUrl: '',
      environment,
    })

    expect(error?.message).toBe('denied')
    expect(tokens).toBeNull()
    expect(emit).not.toHaveBeenCalled()
  })

  it('defaults the redirect URI for interactive flows before authorizing', async () => {
    vi.mocked(authorizeOauth2).mockResolvedValue([null, { accessToken: 'acc' }])

    await runOAuth2Authorize({
      eventBus,
      bearerSchemeName: 'BearerAuth',
      oauth2Name: 'OAuth2',
      flows: baseFlows,
      flowType: 'authorizationCode',
      scopes: [],
      server: null,
      proxyUrl: '',
      environment,
    })

    const passedFlows = vi.mocked(authorizeOauth2).mock.calls[0]![0] as {
      authorizationCode: { 'x-scalar-secret-redirect-uri': string }
    }
    expect(passedFlows.authorizationCode['x-scalar-secret-redirect-uri']).not.toBe('')
  })
})

describe('storeOAuth2Tokens', () => {
  const emit = vi.fn()
  const eventBus = { emit } as unknown as WorkspaceEventBus

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes access to bearer and refresh to oauth2', () => {
    storeOAuth2Tokens(eventBus, {
      bearerSchemeName: 'BearerAuth',
      oauth2Name: 'OAuth2',
      flowType: 'authorizationCode',
      tokens: { accessToken: 'a', refreshToken: 'r' },
    })

    expect(emit).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenCalledWith('auth:update:security-scheme-secrets', {
      payload: { type: 'http', 'x-scalar-secret-token': 'a' },
      name: 'BearerAuth',
    })
    expect(emit).toHaveBeenCalledWith('auth:update:security-scheme-secrets', {
      payload: {
        type: 'oauth2',
        authorizationCode: { 'x-scalar-secret-refresh-token': 'r' },
      },
      name: 'OAuth2',
    })
  })
})
