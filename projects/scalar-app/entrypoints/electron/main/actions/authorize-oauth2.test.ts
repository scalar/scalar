import http from 'node:http'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getAllWindowsMock, openExternalMock } = vi.hoisted(() => ({
  getAllWindowsMock: vi.fn(() => []),
  openExternalMock: vi.fn(),
}))

vi.mock('electron/common', () => ({
  shell: {
    openExternal: openExternalMock,
  },
}))

vi.mock('electron/main', () => ({
  BrowserWindow: {
    getAllWindows: getAllWindowsMock,
  },
}))

import { authorizeOauth2 } from './authorize-oauth2'

type RawResponse = {
  body: string
  statusCode: number
}

const baseAuthorizationUrl = 'https://auth.example.com/authorize?response_type=code&client_id=abc&state=xyz'

/** Reads the loopback redirect_uri the action appended to the opened URL. */
const parseOpenedRedirectUri = (): { port: number; redirectUri: string } => {
  const openedUrl = new URL(openExternalMock.mock.calls[0]![0]!)
  const redirectUri = openedUrl.searchParams.get('redirect_uri')

  if (!redirectUri) {
    throw new Error('Expected the opened URL to include a redirect_uri')
  }

  return { port: Number(new URL(redirectUri).port), redirectUri }
}

const waitForBrowserToOpen = async (): Promise<void> => {
  await vi.waitFor(() => {
    expect(openExternalMock).toHaveBeenCalled()
  })
  // Give the loopback server a tick to settle before connecting.
  await new Promise((resolve) => setTimeout(resolve, 0))
}

const sendRequest = ({ path, port }: { path: string; port: number }): Promise<RawResponse> =>
  new Promise((resolve, reject) => {
    const request = http.request({ host: '127.0.0.1', method: 'GET', path, port }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => {
        resolve({ body, statusCode: response.statusCode ?? 0 })
      })
    })

    request.on('error', reject)
    request.end()
  })

describe('authorize-oauth2', () => {
  beforeEach(() => {
    getAllWindowsMock.mockReturnValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('opens the system browser with an appended loopback redirect_uri', async () => {
    const resultPromise = authorizeOauth2({ authorizationUrl: baseAuthorizationUrl })
    await waitForBrowserToOpen()

    const { port, redirectUri } = parseOpenedRedirectUri()

    expect(redirectUri).toBe(`http://127.0.0.1:${port}/callback`)
    expect(openExternalMock).toHaveBeenCalledWith(expect.stringContaining('response_type=code'), { activate: true })

    await sendRequest({ path: '/callback?code=auth_code&state=xyz', port })
    await resultPromise
  })

  it('resolves with the callback URL once the provider redirects back', async () => {
    const resultPromise = authorizeOauth2({ authorizationUrl: baseAuthorizationUrl })
    await waitForBrowserToOpen()

    const { port, redirectUri } = parseOpenedRedirectUri()
    await sendRequest({ path: '/callback?code=auth_code&state=xyz', port })

    const result = await resultPromise

    expect(result).toEqual({
      callbackUrl: `http://127.0.0.1:${port}/callback?code=auth_code&state=xyz`,
      redirectUri,
    })
  })

  it('serves a fragment-relay page when no params arrive, then captures the relayed params', async () => {
    const resultPromise = authorizeOauth2({ authorizationUrl: baseAuthorizationUrl })
    await waitForBrowserToOpen()

    const { port } = parseOpenedRedirectUri()

    // Implicit responses put the token in the fragment, which the browser does
    // not send, so the first request has no params and gets the relay page.
    const relay = await sendRequest({ path: '/callback', port })
    expect(relay.statusCode).toBe(200)
    expect(relay.body).toContain('location.replace')

    // The relay page redirects back with the token in the query string.
    await sendRequest({ path: '/callback?access_token=tok&state=xyz', port })

    const result = await resultPromise
    expect(result).toEqual({
      callbackUrl: `http://127.0.0.1:${port}/callback?access_token=tok&state=xyz`,
      redirectUri: `http://127.0.0.1:${port}/callback`,
    })
  })

  it('ignores unrelated paths such as the favicon probe', async () => {
    const resultPromise = authorizeOauth2({ authorizationUrl: baseAuthorizationUrl })
    await waitForBrowserToOpen()

    const { port } = parseOpenedRedirectUri()

    const favicon = await sendRequest({ path: '/favicon.ico', port })
    expect(favicon.statusCode).toBe(404)

    // The flow is still pending and resolves only on the real callback.
    await sendRequest({ path: '/callback?code=auth_code&state=xyz', port })
    await resultPromise
  })

  it('returns an error when no callback arrives before the timeout', async () => {
    vi.useFakeTimers()

    const resultPromise = authorizeOauth2({ authorizationUrl: baseAuthorizationUrl })
    await vi.dynamicImportSettled()

    expect(openExternalMock).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(3 * 60 * 1000)

    await expect(resultPromise).resolves.toEqual({ error: 'OAuth2 authorization timed out' })
  })

  it('returns an error when the authorization URL is invalid', async () => {
    const result = await authorizeOauth2({ authorizationUrl: 'not a url' })

    expect(result).toHaveProperty('error')
    expect(openExternalMock).not.toHaveBeenCalled()
  })
})
