import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMockServer } from '@/create-mock-server'

const createServer = (): ReturnType<typeof createMockServer> =>
  createMockServer({
    logger: false,
    document: {
      openapi: '3.2.1',
      info: { title: 'Device authorization', version: '1' },
      paths: { '/pets': { get: { security: [{ oauth: [] }], responses: { '200': { description: 'OK' } } } } },
      components: {
        securitySchemes: {
          oauth: {
            type: 'oauth2',
            oauth2MetadataUrl: '/metadata',
            flows: {
              deviceAuthorization: { deviceAuthorizationUrl: '/device', tokenUrl: '/token', scopes: { read: 'Read' } },
              clientCredentials: { tokenUrl: '/token', scopes: {} },
            },
          },
        },
      },
    },
  })
const post = (body: Record<string, string>): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(body),
})

describe('set-up-device-authorization', () => {
  afterEach(() => vi.useRealTimers())

  it.each([true, false])(
    'matches body and form-encoded Basic client IDs (Basic issuance: %s)',
    async (basicIssuance) => {
      const server = await createServer()
      const clientId = 'client: with+symbols'
      const basic = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa('client%3A+with%2Bsymbols:secret')}`,
      }
      const device = await (
        await server.request('/device', basicIssuance ? { ...post({}), headers: basic } : post({ client_id: clientId }))
      ).json()
      await server.request('/device/verify', post({ user_code: device.user_code, decision: 'approve' }))
      const tokenBody = {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: device.device_code,
      }
      const response = await server.request(
        '/token',
        basicIssuance ? post({ ...tokenBody, client_id: clientId }) : { ...post(tokenBody), headers: basic },
      )
      expect(response.status).toBe(200)
      expect((await response.json()).access_token).toBe('super-secret-access-token')
    },
  )

  it('requires approval before issuing a token and supports shared token routes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const server = await createServer()
    const response = await server.request('/device', post({ client_id: 'client', scope: 'read' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    const device = await response.json()
    const tokenBody = {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: device.device_code,
      client_id: 'client',
    }
    expect(await (await server.request('/token', post(tokenBody))).json()).toStrictEqual({
      error: 'authorization_pending',
    })
    expect(await (await server.request('/token', post(tokenBody))).json()).toStrictEqual({ error: 'slow_down' })
    expect((await server.request(device.verification_uri_complete)).status).toBe(200)
    expect(
      (await server.request('/device/verify', post({ user_code: device.user_code, decision: 'approve' }))).status,
    ).toBe(200)
    vi.setSystemTime(Date.now() + 10000)
    const token = await (await server.request('/token', post(tokenBody))).json()
    expect(token.access_token).toBe('super-secret-access-token')
    expect((await server.request('/pets', { headers: { Authorization: `Bearer ${token.access_token}` } })).status).toBe(
      200,
    )
    expect(await (await server.request('/token', post(tokenBody))).json()).toStrictEqual({ error: 'invalid_grant' })
    expect((await server.request('/token', post({ grant_type: 'client_credentials' }))).status).toBe(200)
    const metadata = await (await server.request('/metadata')).json()
    expect(metadata.device_authorization_endpoint).toBe('http://localhost/device')
    expect(metadata.grant_types_supported).toStrictEqual([
      'client_credentials',
      'urn:ietf:params:oauth:grant-type:device_code',
    ])
  })

  it('rejects missing clients, mismatched clients, denied and expired codes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const server = await createServer()
    expect((await server.request('/device', post({}))).status).toBe(400)
    const device = await (await server.request('/device', post({ client_id: 'client' }))).json()
    const body = {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: device.device_code,
      client_id: 'wrong',
    }
    expect(await (await server.request('/token', post(body))).json()).toStrictEqual({ error: 'invalid_grant' })
    await server.request('/device/verify', post({ user_code: device.user_code, decision: 'deny' }))
    expect(await (await server.request('/token', post({ ...body, client_id: 'client' }))).json()).toStrictEqual({
      error: 'access_denied',
    })
    const expired = await (await server.request('/device', post({ client_id: 'client' }))).json()
    vi.setSystemTime(Date.now() + 600001)
    expect(
      await (
        await server.request('/token', post({ ...body, client_id: 'client', device_code: expired.device_code }))
      ).json(),
    ).toStrictEqual({ error: 'expired_token' })
  })
})
