import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

import { setUpAuthenticationRoutes } from './set-up-authentication-routes'

const create = (): Hono => {
  const app = new Hono()
  setUpAuthenticationRoutes(app, {
    openapi: '3.1.0',
    info: { title: 'Identity', version: '1' },
    components: {
      securitySchemes: {
        oidc: {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://provider.example.com/.well-known/openid-configuration',
        },
        oauth: { type: 'oauth2', flows: { clientCredentials: { tokenUrl: '/oauth/token', scopes: {} } } },
      },
    },
  })
  return app
}
const origin = 'https://mock.example.com'
const authorize = async (app: Hono, extra: Record<string, string> = {}): Promise<string> => {
  const query = new URLSearchParams({
    client_id: 'client',
    response_type: 'code',
    redirect_uri: 'http://localhost/callback',
    scope: 'openid profile email',
    state: 'state',
    nonce: 'nonce',
    ...extra,
  })
  const response = await app.request(`${origin}/oauth/authorize?${query}`)
  expect(response.status).toBe(200)
  const html = await response.text()
  expect(html).toContain('state=state')
  const code = html.match(/code=(oidc-code-[\w-]+)/)?.[1]
  if (!code) throw new Error('Missing authorization code')
  return code
}
const exchange = (app: Hono, parameters: Record<string, string>): Promise<Response> =>
  Promise.resolve(
    app.request(`${origin}/oauth/token`, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: 'client',
        redirect_uri: 'http://localhost/callback',
        ...parameters,
      }),
    }),
  )

describe('set-up-openid-connect', () => {
  it('issues verifiable ID tokens and scoped UserInfo, then rotates refresh tokens', async () => {
    const app = create()
    const code = await authorize(app)
    const response = await exchange(app, { grant_type: 'authorization_code', code })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const tokens = await response.json()
    const [header, payload, signature] = tokens.id_token.split('.')
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
    expect(claims).toStrictEqual({
      iss: origin,
      sub: 'scalar-mock-user',
      aud: 'client',
      nonce: 'nonce',
      iat: expect.any(Number),
      exp: expect.any(Number),
    })
    expect(claims.exp - claims.iat).toBe(3600)
    const jwks = await (await app.request(`${origin}/oauth/jwks`)).json()
    expect(jwks.keys.length).toBe(1)
    expect(jwks.keys[0].d).toBeUndefined()
    expect(JSON.parse(Buffer.from(header, 'base64url').toString()).kid).toBe(jwks.keys[0].kid)
    const key = await crypto.subtle.importKey(
      'jwk',
      jwks.keys[0],
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    expect(
      await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        Buffer.from(signature, 'base64url'),
        new TextEncoder().encode(`${header}.${payload}`),
      ),
    ).toBe(true)
    expect((await exchange(app, { grant_type: 'authorization_code', code })).status).toBe(400)
    const userinfo = await app.request(`${origin}/oauth/userinfo`, {
      headers: { Authorization: `bearer ${tokens.access_token}` },
    })
    expect(await userinfo.json()).toStrictEqual({
      sub: claims.sub,
      name: 'Scalar Mock User',
      preferred_username: 'scalar',
      email: 'mock@example.com',
      email_verified: true,
    })
    expect((await app.request(`${origin}/oauth/userinfo`)).status).toBe(401)
    expect(
      (await app.request(`${origin}/oauth/userinfo`, { headers: { Authorization: 'Bearer arbitrary' } })).status,
    ).toBe(401)
    const refreshed = await exchange(app, {
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      scope: 'openid',
    })
    expect(refreshed.status).toBe(200)
    const newTokens = await refreshed.json()
    expect(newTokens.refresh_token).not.toBe(tokens.refresh_token)
    expect((await exchange(app, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token })).status).toBe(400)
    expect(
      await (
        await app.request(`${origin}/oauth/userinfo`, {
          headers: { Authorization: `Bearer ${newTokens.access_token}` },
        })
      ).json(),
    ).toStrictEqual({ sub: claims.sub })
    expect((await exchange(app, { grant_type: 'client_credentials' })).status).toBe(200)
  })

  it('binds codes to client and redirect URI, and validates S256 PKCE', async () => {
    const app = create()
    const verifier = 'v'.repeat(43)
    const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString(
      'base64url',
    )
    const code = await authorize(app, { code_challenge: challenge, code_challenge_method: 'S256' })
    const invalidParameters: Record<string, string>[] = [
      { client_id: 'other' },
      { redirect_uri: 'http://other/callback' },
      { code_verifier: 'wrong' },
    ]
    for (const extra of invalidParameters) {
      expect(
        (await exchange(app, { grant_type: 'authorization_code', code, code_verifier: verifier, ...extra })).status,
      ).toBe(400)
    }
    expect(
      (await exchange(app, { grant_type: 'authorization_code', code, code_verifier: verifier, scope: 'openid admin' }))
        .status,
    ).toBe(400)
    const attempts = await Promise.all(
      [1, 2].map(() => exchange(app, { grant_type: 'authorization_code', code, code_verifier: verifier })),
    )
    expect(attempts.map((response) => response.status).sort()).toStrictEqual([200, 400])
  })

  it('expires authorization codes and access tokens', async () => {
    const app = create()
    const date = vi.spyOn(Date, 'now')
    try {
      date.mockReturnValue(2000000000000)
      const expiredCode = await authorize(app)
      date.mockReturnValue(2000000360000)
      expect((await exchange(app, { grant_type: 'authorization_code', code: expiredCode })).status).toBe(400)
      const code = await authorize(app)
      const tokens = await (await exchange(app, { grant_type: 'authorization_code', code })).json()
      date.mockReturnValue(2000004000000)
      expect(
        (await app.request(`${origin}/oauth/userinfo`, { headers: { Authorization: `Bearer ${tokens.access_token}` } }))
          .status,
      ).toBe(401)
    } finally {
      date.mockRestore()
    }
  })

  it('rejects incomplete OIDC requests and unsupported response types', async () => {
    const app = create()
    expect((await app.request(`${origin}/oauth/authorize?scope=openid`)).status).toBe(400)
    expect(
      (
        await app.request(
          `${origin}/oauth/authorize?scope=openid&client_id=client&redirect_uri=http://localhost&response_type=id_token`,
        )
      ).status,
    ).toBe(400)
    expect((await exchange(app, { grant_type: 'authorization_code', code: 'unknown', scope: 'openid' })).status).toBe(
      400,
    )
  })
})
