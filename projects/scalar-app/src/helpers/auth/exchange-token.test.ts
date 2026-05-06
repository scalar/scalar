import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { exchangeToken } from './exchange-token'

vi.mock('@/environment', () => ({
  env: { VITE_SERVICES_URL: 'https://api.scalar.test' },
}))

const VALID_RESPONSE = {
  accessToken: 'access.token.value',
  refreshToken: 'refresh.token.value',
}

const mockFetch = (body: unknown, ok = true, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

describe('exchangeToken', () => {
  beforeEach(() => {
    vi.stubGlobal('console', { ...console, error: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns [null, data] with the token pair on a successful response', async () => {
    mockFetch(VALID_RESPONSE)

    const [err, data] = await exchangeToken('my-exchange-token')

    expect(err).toBeNull()
    expect(data).toEqual(VALID_RESPONSE)
  })

  it('returns [Error, null] when the response status is not ok', async () => {
    mockFetch({ message: 'Unauthorized' }, false, 401)

    const [err, data] = await exchangeToken('bad-token')

    expect(err).toBeInstanceOf(Error)
    expect(data).toBeNull()
  })

  it('returns [Error, null] when the response body is missing required fields', async () => {
    mockFetch({ accessToken: 'only-one-field' })

    const [err, data] = await exchangeToken('exchange-token')

    expect(err).toBeInstanceOf(Error)
    expect(data).toBeNull()
  })

  it('returns [Error, null] when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))

    const [err, data] = await exchangeToken('exchange-token')

    expect(err).toBeInstanceOf(Error)
    expect(err?.message).toBe('Network failure')
    expect(data).toBeNull()
  })

  it('sends a POST request with the correct headers and body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(VALID_RESPONSE),
    })
    vi.stubGlobal('fetch', fetchSpy)

    await exchangeToken('my-exchange-token')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.scalar.test/core/login/exchange',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ exchangeToken: 'my-exchange-token' }),
      }),
    )
  })

  it('succeeds when response includes extra unknown fields beyond the schema', async () => {
    mockFetch({ ...VALID_RESPONSE, extraField: 'ignored', count: 42 })

    const [err, data] = await exchangeToken('exchange-token')

    expect(err).toBeNull()
    expect(data).toEqual(VALID_RESPONSE)
  })

  it('returns [Error, null] when the response body is not an object (e.g. an array)', async () => {
    mockFetch([VALID_RESPONSE])

    const [err, data] = await exchangeToken('exchange-token')

    expect(err).toBeInstanceOf(Error)
    expect(data).toBeNull()
  })
})
