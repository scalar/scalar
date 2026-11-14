import { createHash } from 'node:crypto'
import http from 'node:http'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { exchangeTokenMock, openExternalMock } = vi.hoisted(() => ({
  exchangeTokenMock: vi.fn(),
  openExternalMock: vi.fn(),
}))

vi.mock('electron/common', () => ({ shell: { openExternal: openExternalMock } }))
vi.mock('@/environment', () => ({ env: { VITE_DASHBOARD_URL: 'https://dashboard.scalar.test' } }))
vi.mock('@/helpers/auth/exchange-token', () => ({ exchangeToken: exchangeTokenMock }))

import { getExchangeToken } from './get-exchange-token'

const TOKENS = { accessToken: 'access-token-value', refreshToken: 'refresh-token-value' }

const sendRequest = (
  port: number,
  path: string,
  method = 'GET',
  host = `127.0.0.1:${port}`,
): Promise<{
  status: number | undefined
  headers: http.IncomingHttpHeaders
  body: string
}> =>
  new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port, method, path, headers: { Host: host } }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }))
    })
    request.on('error', reject)
    request.end()
  })

const startLogin = async (
  flow: 'login' | 'register' = 'login',
): Promise<{ result: ReturnType<typeof getExchangeToken>; url: URL; port: number; state: string; path: string }> => {
  const result = getExchangeToken(flow)
  await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled())
  const url = new URL(openExternalMock.mock.lastCall![0])
  const port = Number(url.searchParams.get('port'))
  const state = url.searchParams.get('state')!
  const path = `/callback?${new URLSearchParams({ state, exchangeToken: 'exchange-token' })}`
  return { result, url, port, state, path }
}

describe('get-exchange-token', () => {
  beforeEach(() => {
    exchangeTokenMock.mockResolvedValue([null, TOKENS])
    openExternalMock.mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it.each(['login', 'register'] as const)(
    'finishes %s through a state-checked redirect and PKCE exchange',
    async (flow) => {
      const { result, url, port, state, path } = await startLogin(flow)
      expect(url.origin).toBe('https://dashboard.scalar.test')
      expect(url.pathname).toBe(`/${flow}`)
      expect(url.searchParams.get('externalRedirect')).toBe('local')
      expect(url.searchParams.get('callback')).toBe('redirect')
      expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(url.searchParams.has('codeVerifier')).toBe(false)

      const response = await sendRequest(port, path)
      expect(await result).toStrictEqual(TOKENS)
      expect(response.status).toBe(303)
      expect(response.headers.location).toBe('https://dashboard.scalar.test/login/exchange/success')
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.headers['referrer-policy']).toBe('no-referrer')
      expect(response.body).toBe('')
      expect(exchangeTokenMock.mock.calls.length).toBe(1)
      const [token, { codeVerifier, signal }] = exchangeTokenMock.mock.calls[0]!
      expect(token).toBe('exchange-token')
      expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(createHash('sha256').update(codeVerifier).digest('base64url')).toBe(url.searchParams.get('codeChallenge'))
      expect(signal).toBeInstanceOf(AbortSignal)
      await expect(sendRequest(port, path)).rejects.toThrow()
    },
  )

  it.each([
    { name: 'favicon', path: '/favicon.ico', status: 404 },
    { name: 'missing state', path: '/callback?exchangeToken=token', status: 400 },
    { name: 'incorrect state', path: '/callback?exchangeToken=token&state=wrong', status: 400 },
    { name: 'OPTIONS preflight', path: null, method: 'OPTIONS', status: 405 },
    { name: 'POST callback', path: null, method: 'POST', status: 405 },
    { name: 'foreign Host header', path: null, host: 'evil.example', status: 400 },
  ])('ignores $name without consuming the login attempt', async ({ path: invalidPath, method, host, status }) => {
    const { result, port, path } = await startLogin()
    const response = await sendRequest(port, invalidPath ?? path, method, host)
    expect(response.status).toBe(status)
    expect(exchangeTokenMock).not.toHaveBeenCalled()
    await sendRequest(port, path)
    expect(await result).toStrictEqual(TOKENS)
  })

  it.each(['', '&exchangeToken=', '&exchangeToken=one&exchangeToken=two', '&exchangeToken=one&state=other'])(
    'rejects missing or ambiguous callback parameters: %s',
    async (query) => {
      const { result, port, state, path } = await startLogin()
      expect((await sendRequest(port, `/callback?state=${state}${query}`)).status).toBe(400)
      expect(exchangeTokenMock).not.toHaveBeenCalled()
      await sendRequest(port, path)
      expect(await result).toStrictEqual(TOKENS)
    },
  )

  it('decodes the exchange token without including it in the return URL', async () => {
    const { result, port, state } = await startLogin()
    const response = await sendRequest(port, `/callback?state=${state}&exchangeToken=token%20with%2Bsymbols`)
    await result
    expect(exchangeTokenMock.mock.calls[0]![0]).toBe('token with+symbols')
    expect(response.headers.location).toBe('https://dashboard.scalar.test/login/exchange/success')
  })

  it('returns to the failure page when code redemption fails', async () => {
    exchangeTokenMock.mockResolvedValue([new Error('Invalid code'), null])
    const { result, port, path } = await startLogin()
    const response = await sendRequest(port, path)
    expect(await result).toBeNull()
    expect(response.status).toBe(303)
    expect(response.headers.location).toBe('https://dashboard.scalar.test/login/exchange/failure')
    await expect(sendRequest(port, path)).rejects.toThrow()
  })

  it('exchanges only once when two valid callbacks arrive together', async () => {
    let resolve!: (value: [null, typeof TOKENS]) => void
    const promise = new Promise<[null, typeof TOKENS]>((complete) => {
      resolve = complete
    })
    exchangeTokenMock.mockReturnValue(promise)
    const { result, port, path } = await startLogin()
    const first = sendRequest(port, path)
    await vi.waitFor(() => expect(exchangeTokenMock).toHaveBeenCalledTimes(1))
    expect((await sendRequest(port, path)).status).toBe(409)
    resolve([null, TOKENS])
    expect((await first).status).toBe(303)
    expect(await result).toStrictEqual(TOKENS)
    expect(exchangeTokenMock).toHaveBeenCalledTimes(1)
  })

  it('keeps a redeemed session when the browser closes during the exchange', async () => {
    let resolve!: (value: [null, typeof TOKENS]) => void
    exchangeTokenMock.mockReturnValue(
      new Promise<[null, typeof TOKENS]>((complete) => {
        resolve = complete
      }),
    )
    const { result, port, path } = await startLogin()
    const request = http.get({ hostname: '127.0.0.1', port, path })
    request.on('error', () => undefined)
    await vi.waitFor(() => expect(exchangeTokenMock).toHaveBeenCalledTimes(1))
    const closed = new Promise<void>((complete) => request.once('close', complete))
    request.destroy()
    await closed
    resolve([null, TOKENS])
    expect(await result).toStrictEqual(TOKENS)
    await expect(sendRequest(port, path)).rejects.toThrow()
  })

  it('uses different state and PKCE secrets for each attempt', async () => {
    const first = await startLogin()
    await sendRequest(first.port, first.path)
    await first.result
    openExternalMock.mockClear()
    const second = await startLogin()
    expect(second.state).not.toBe(first.state)
    expect(second.url.searchParams.get('codeChallenge')).not.toBe(first.url.searchParams.get('codeChallenge'))
    await sendRequest(second.port, second.path)
    await second.result
  })

  it('times out and releases the listener when the browser never returns', async () => {
    vi.useFakeTimers()
    const pending = getExchangeToken('login')
    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled())
    const timeoutPort = Number(new URL(openExternalMock.mock.lastCall![0]).searchParams.get('port'))
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000)
    expect(await pending).toBeNull()
    vi.useRealTimers()
    await expect(sendRequest(timeoutPort, '/callback')).rejects.toThrow()
  })
})
