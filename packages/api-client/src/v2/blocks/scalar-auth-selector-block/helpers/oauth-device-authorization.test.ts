import type { OAuthFlowDeviceAuthorizationSecret } from '@scalar/workspace-store/request-example'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { authorizeDevice } from './oauth-device-authorization'

const flow: OAuthFlowDeviceAuthorizationSecret = {
  deviceAuthorizationUrl: 'https://auth.example/device',
  tokenUrl: 'https://auth.example/token',
  refreshUrl: '',
  scopes: {},
  'x-scalar-secret-client-id': 'client',
  'x-scalar-secret-client-secret': '',
  'x-scalar-secret-token': '',
}
const device = {
  device_code: 'secret-device',
  user_code: 'USER-CODE',
  verification_uri: 'https://auth.example/verify',
  expires_in: 600,
  interval: 1,
}
const json = (body: unknown, status = 200): Response => Response.json(body, { status })

describe('oauth-device-authorization', () => {
  afterEach(() => vi.useRealTimers())

  it('displays the code, waits between polls, backs off, and returns tokens', async () => {
    vi.useFakeTimers()
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(device))
      .mockResolvedValueOnce(json({ error: 'authorization_pending' }, 400))
      .mockResolvedValueOnce(json({ error: 'slow_down' }, 400))
      .mockResolvedValueOnce(json({ access_token: 'access', refresh_token: 'refresh' }))
    const onPrompt = vi.fn()
    const result = authorizeDevice(flow, ['read'], null, '', {}, fetcher, {
      onPrompt,
      signal: new AbortController().signal,
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(onPrompt.mock.calls).toStrictEqual([
      [{ userCode: 'USER-CODE', verificationUri: 'https://auth.example/verify' }],
    ])
    expect(fetcher.mock.calls.length).toBe(1)
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toBe('client_id=client&scope=read')
    await vi.advanceTimersByTimeAsync(2000)
    expect(fetcher.mock.calls.length).toBe(3)
    await vi.advanceTimersByTimeAsync(5999)
    expect(fetcher.mock.calls.length).toBe(3)
    await vi.advanceTimersByTimeAsync(1)
    expect(await result).toStrictEqual([null, { accessToken: 'access', refreshToken: 'refresh' }])
    expect(String(fetcher.mock.calls[3]?.[1]?.body)).toBe(
      'client_id=client&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code&device_code=secret-device',
    )
  })

  it.each(['access_denied', 'expired_token', 'invalid_grant'])('stops polling on %s', async (error) => {
    vi.useFakeTimers()
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(device))
      .mockResolvedValueOnce(json({ error }, 400))
    const result = authorizeDevice(flow, [], null, '', {}, fetcher, {
      onPrompt: vi.fn(),
      signal: new AbortController().signal,
    })
    await vi.advanceTimersByTimeAsync(1000)
    expect((await result)[0]?.message).toBe(error)
    expect(fetcher.mock.calls.length).toBe(2)
  })

  it('clamps a zero polling interval without rejecting authorization', async () => {
    vi.useFakeTimers()
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ ...device, interval: 0 }))
      .mockResolvedValueOnce(json({ access_token: 'access' }))
    const result = authorizeDevice(flow, [], null, '', {}, fetcher, {
      onPrompt: vi.fn(),
      signal: new AbortController().signal,
    })
    await vi.advanceTimersByTimeAsync(999)
    expect(fetcher.mock.calls.length).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(await result).toStrictEqual([null, { accessToken: 'access' }])
  })

  it('cancels pending polling without another request', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(json(device))
    const result = authorizeDevice(flow, [], null, '', {}, fetcher, { onPrompt: vi.fn(), signal: controller.signal })
    await vi.advanceTimersByTimeAsync(0)
    controller.abort(new Error('Cancelled'))
    expect((await result)[0]?.message).toBe('Cancelled')
    await vi.advanceTimersByTimeAsync(10000)
    expect(fetcher.mock.calls.length).toBe(1)
  })

  it.each([
    { ...device, verification_uri: 'javascript:alert(1)' },
    { ...device, device_code: '' },
    { ...device, interval: -1 },
    { ...device, expires_in: 0 },
  ])('rejects invalid authorization responses', async (response) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(json(response))
    const onPrompt = vi.fn()
    const [error, token] = await authorizeDevice(flow, [], null, '', {}, fetcher, {
      onPrompt,
      signal: new AbortController().signal,
    })
    expect(error instanceof Error).toBe(true)
    expect(token).toBeNull()
    expect(onPrompt.mock.calls).toStrictEqual([])
    expect(fetcher.mock.calls.length).toBe(1)
  })
  it('expires locally without polling after the device code expires', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ ...device, expires_in: 1, interval: 5 }))
    const result = authorizeDevice(flow, [], null, '', {}, fetcher, {
      onPrompt: vi.fn(),
      signal: new AbortController().signal,
    })
    await vi.advanceTimersByTimeAsync(1000)
    expect((await result)[0]?.message).toBe('Device authorization expired')
    expect(fetcher.mock.calls.length).toBe(1)
  })

  it('reduces polling frequency after a connection timeout', async () => {
    vi.useFakeTimers()
    const timeout = new Error('Timed out')
    timeout.name = 'TimeoutError'
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(device))
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(json({ access_token: 'access' }))
    const result = authorizeDevice(flow, [], null, '', {}, fetcher, {
      onPrompt: vi.fn(),
      signal: new AbortController().signal,
    })
    await vi.advanceTimersByTimeAsync(2999)
    expect(fetcher.mock.calls.length).toBe(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(await result).toStrictEqual([null, { accessToken: 'access' }])
  })

  it('resolves environment variables and proxies both requests with confidential credentials', async () => {
    vi.useFakeTimers()
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(device))
      .mockResolvedValueOnce(json({ custom_token: 'access' }))
    const result = authorizeDevice(
      {
        ...flow,
        deviceAuthorizationUrl: '/device',
        tokenUrl: '/token',
        'x-scalar-secret-client-id': '{{client}}',
        'x-scalar-secret-client-secret': 'secret',
        'x-scalar-credentials-location': 'body',
        'x-tokenName': 'custom_token',
      },
      [],
      { url: 'https://auth.example' },
      'https://proxy.example',
      { client: 'resolved' },
      fetcher,
      { onPrompt: vi.fn(), signal: new AbortController().signal },
    )
    await vi.advanceTimersByTimeAsync(1000)
    expect(await result).toStrictEqual([null, { accessToken: 'access' }])
    expect(fetcher.mock.calls.map(([url]) => String(url))).toStrictEqual([
      'https://proxy.example/?scalar_url=https%3A%2F%2Fauth.example%2Fdevice',
      'https://proxy.example/?scalar_url=https%3A%2F%2Fauth.example%2Ftoken',
    ])
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toBe('client_id=resolved&client_secret=secret')
  })
})
