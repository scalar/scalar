import http from 'node:http'

import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { exchangeTokenMock, getPortMock, openExternalMock } = vi.hoisted(() => ({
  exchangeTokenMock: vi.fn(),
  getPortMock: vi.fn(),
  openExternalMock: vi.fn(),
}))

vi.mock('electron/common', () => ({
  shell: {
    openExternal: openExternalMock,
  },
}))

vi.mock('get-port', () => ({
  default: getPortMock,
}))

vi.mock('@/environment', () => ({
  env: {
    VITE_DASHBOARD_URL: 'https://dashboard.scalar.test',
  },
}))

vi.mock('@/helpers/auth/exchange-token', () => ({
  exchangeToken: exchangeTokenMock,
}))

import type { TokenResponse } from '@/helpers/auth/schema'

import { getExchangeToken } from './get-exchange-token'

type CallbackResponse = {
  body: {
    error: boolean
    message: string
    success: boolean
  }
  headers: http.IncomingHttpHeaders
  statusCode: number
}

const VALID_TOKEN_RESPONSE = {
  accessToken: 'access-token-value',
  refreshToken: 'refresh-token-value',
} satisfies TokenResponse

const parseOpenedCallbackPort = (): number => {
  const openedUrl = new URL(openExternalMock.mock.calls[0]![0]!)
  const port = openedUrl.searchParams.get('port')

  if (!port) {
    throw new Error('Expected openExternal URL to include a port')
  }

  return Number(port)
}

const waitForLoginPageToOpen = async (): Promise<void> => {
  await vi.waitFor(() => {
    expect(openExternalMock).toHaveBeenCalled()
  })

  // Give the callback server a tick to settle before the test client connects.
  await new Promise((resolve) => setTimeout(resolve, 0))
}

const sendCallbackRequest = ({
  host = '127.0.0.1',
  method = 'POST',
  path,
  port,
}: {
  host?: string
  method?: string
  path: string
  port: number
}): Promise<CallbackResponse> =>
  new Promise((resolve, reject) => {
    const request = http.request(
      {
        host,
        method,
        path,
        port,
      },
      (response) => {
        let body = ''

        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          resolve({
            body: JSON.parse(body) as CallbackResponse['body'],
            headers: response.headers,
            statusCode: response.statusCode ?? 0,
          })
        })
      },
    )

    request.on('error', reject)
    request.end()
  })

describe('get-exchange-token', () => {
  let nextPort = 38200
  let consoleErrorSpy: Mock

  beforeEach(() => {
    getPortMock.mockImplementation(() => nextPort++)
    exchangeTokenMock.mockResolvedValue([null, VALID_TOKEN_RESPONSE])
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    consoleErrorSpy.mockRestore()
  })

  it('opens the dashboard login page with the local callback port', async () => {
    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()

    expect(openExternalMock).toHaveBeenCalledWith(
      `https://dashboard.scalar.test/login?externalRedirect=local&port=${port}`,
      { activate: true },
    )

    await sendCallbackRequest({
      path: '/callback?exchangeToken=external-login-token',
      port,
    })

    await resultPromise
  })

  it('returns exchanged tokens after a valid POST callback', async () => {
    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()
    const response = await sendCallbackRequest({
      path: '/callback?exchangeToken=external-login-token',
      port,
    })
    const result = await resultPromise

    expect(exchangeTokenMock).toHaveBeenCalledWith('external-login-token')
    expect(result).toEqual(VALID_TOKEN_RESPONSE)
    expect(response).toEqual(
      expect.objectContaining({
        body: {
          error: false,
          message: 'Token exchanged.',
          success: true,
        },
        statusCode: 200,
      }),
    )
    expect(response.headers['content-type']).toBe('application/json')
    expect(response.headers['access-control-allow-origin']).toBe(`http://127.0.0.1:${port}`)
  })

  it('tears down the callback server after the login attempt finishes', async () => {
    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()
    await sendCallbackRequest({
      path: '/callback?exchangeToken=external-login-token',
      port,
    })
    await resultPromise

    await expect(
      sendCallbackRequest({
        path: '/callback?exchangeToken=stale-token',
        port,
      }),
    ).rejects.toBeInstanceOf(Error)
  })

  it('accepts the dashboard callback sent to localhost', async () => {
    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()
    let callbackReachedServer = false

    try {
      const response = await sendCallbackRequest({
        host: 'localhost',
        path: '/callback?exchangeToken=external-login-token',
        port,
      })
      callbackReachedServer = true
      const result = await resultPromise

      expect(exchangeTokenMock).toHaveBeenCalledWith('external-login-token')
      expect(result).toEqual(VALID_TOKEN_RESPONSE)
      expect(response.statusCode).toBe(200)
    } finally {
      if (!callbackReachedServer) {
        await sendCallbackRequest({
          path: '/callback?exchangeToken=cleanup-token',
          port,
        }).catch(() => undefined)
        await resultPromise.catch(() => undefined)
      }
    }
  })

  it('passes URL-decoded exchange tokens to the exchange endpoint', async () => {
    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()
    await sendCallbackRequest({
      path: '/callback?exchangeToken=token%20with%20spaces%2Band%2Bsymbols',
      port,
    })
    await resultPromise

    expect(exchangeTokenMock).toHaveBeenCalledWith('token with spaces+and+symbols')
  })

  it('returns null and a 405 response for non-POST callbacks', async () => {
    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()
    const response = await sendCallbackRequest({
      method: 'GET',
      path: '/callback?exchangeToken=external-login-token',
      port,
    })
    const result = await resultPromise

    expect(exchangeTokenMock).not.toHaveBeenCalled()
    expect(result).toBeNull()
    expect(response).toEqual(
      expect.objectContaining({
        body: {
          error: true,
          message: 'Method not allowed',
          success: false,
        },
        statusCode: 405,
      }),
    )
    expect(response.headers['access-control-allow-origin']).toBe(`http://127.0.0.1:${port}`)
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error))
  })

  it.each([
    ['/callback', 'without a query parameter'],
    ['/callback?exchangeToken=', 'with a blank query parameter'],
  ])('returns null and a 400 response when the token is missing %s', async (path) => {
    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()
    const response = await sendCallbackRequest({ path, port })
    const result = await resultPromise

    expect(exchangeTokenMock).not.toHaveBeenCalled()
    expect(result).toBeNull()
    expect(response).toEqual(
      expect.objectContaining({
        body: {
          error: true,
          message: 'Missing exchange token',
          success: false,
        },
        statusCode: 400,
      }),
    )
  })

  it('returns null and a 400 response when the exchange endpoint rejects the token', async () => {
    exchangeTokenMock.mockResolvedValue([new Error('Invalid exchange token'), null])

    const resultPromise = getExchangeToken()
    await waitForLoginPageToOpen()

    const port = parseOpenedCallbackPort()
    const response = await sendCallbackRequest({
      path: '/callback?exchangeToken=bad-token',
      port,
    })
    const result = await resultPromise

    expect(exchangeTokenMock).toHaveBeenCalledWith('bad-token')
    expect(result).toBeNull()
    expect(response).toEqual(
      expect.objectContaining({
        body: {
          error: true,
          message: 'Failed to exchange token',
          success: false,
        },
        statusCode: 400,
      }),
    )
  })

  it('returns null when no callback arrives before the timeout', async () => {
    vi.useFakeTimers()

    const resultPromise = getExchangeToken()
    await vi.dynamicImportSettled()

    expect(openExternalMock).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(3 * 60 * 1e3)

    await expect(resultPromise).resolves.toBeNull()
    expect(exchangeTokenMock).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error))
  })
})
