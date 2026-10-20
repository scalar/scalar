import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { respondWithToken } from './respond-with-token'

describe('respond-with-token', () => {
  it.each(['authorization_code', 'client_credentials', 'refresh_token'])(
    'accepts a form-encoded %s grant',
    async (grant) => {
      const app = new Hono().post('/token', respondWithToken)
      const response = await app.request('/token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: grant,
          code: 'example',
          refresh_token: 'example',
          scope: 'openid read:events',
        }),
      })
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('pragma')).toBe('no-cache')
      expect(await response.json()).toStrictEqual({
        access_token: 'super-secret-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'example-refresh-token',
        scope: 'openid read:events',
      })
    },
  )

  it('retains query parameter support', async () => {
    const app = new Hono().post('/token', respondWithToken)
    const response = await app.request('/token?grant_type=authorization_code&code=example&scope=openid', {
      method: 'POST',
    })
    expect(response.status).toBe(200)
    expect((await response.json()).scope).toBe('openid')
  })

  it('prefers form parameters over query parameters', async () => {
    const app = new Hono().post('/token', respondWithToken)
    const response = await app.request('/token?grant_type=invalid&scope=query', {
      method: 'POST',
      body: new URLSearchParams({ grant_type: 'refresh_token', scope: 'form' }),
    })
    expect(response.status).toBe(200)
    expect((await response.json()).scope).toBe('form')
  })

  it.each([
    [{}, 'invalid_request', 'Missing grant_type parameter'],
    [{ grant_type: 'authorization_code' }, 'invalid_request', 'Missing code parameter'],
    [
      { grant_type: 'invalid' },
      'unsupported_grant_type',
      'Grant type must be one of: authorization_code, client_credentials, refresh_token',
    ],
  ] as const)('rejects invalid form parameters %j', async (parameters, error, description) => {
    const app = new Hono().post('/token', respondWithToken)
    const response = await app.request('/token', { method: 'POST', body: new URLSearchParams(parameters) })
    expect(response.status).toBe(400)
    expect(await response.json()).toStrictEqual({ error, error_description: description })
  })
})
