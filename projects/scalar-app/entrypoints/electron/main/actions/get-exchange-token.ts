import { createHash, randomBytes } from 'node:crypto'
import http from 'node:http'

import { shell } from 'electron/common'

import { env } from '@/environment'
import { exchangeToken } from '@/helpers/auth/exchange-token'
import type { TokenResponse } from '@/helpers/auth/schema'

type ExchangeTokenResult = Awaited<ReturnType<typeof exchangeToken>>

const CALLBACK_HOST = '127.0.0.1'
const CALLBACK_TIMEOUT_MS = 3 * 60 * 1000

/**
 * Lets the OS reserve an available port on the callback interface.
 * Resolving only after the listening event keeps the browser redirect from
 * racing ahead of the server setup.
 */
const listenForCallback = (server: http.Server): Promise<void> =>
  new Promise((resolve, reject) => {
    /**
     * Cleans up the paired listener so a failed bind cannot resolve later.
     */
    const onError = (error: Error) => {
      server.off('listening', onListening)
      reject(error)
    }

    /**
     * Cleans up the paired listener once the server is ready for callbacks.
     */
    const onListening = () => {
      server.off('error', onError)
      resolve()
    }

    server.once('error', onError)
    server.once('listening', onListening)
    server.listen({ host: CALLBACK_HOST, port: 0 })
  })

/**
 * Waits for the local callback server to stop accepting connections.
 * `server.close()` is asynchronous, so callers await this before treating the
 * desktop login attempt as fully cleaned up.
 */
const closeCallbackServer = (server: http.Server): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve()
      return
    }

    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })

/**
 * Receives a top-level browser redirect. State rejects unsolicited callbacks;
 * the PKCE verifier never leaves this process until the code is redeemed.
 */
const waitForExchangeTokenCallback = ({
  port,
  server,
  state,
  codeVerifier,
}: {
  port: number
  server: http.Server
  state: string
  codeVerifier: string
}): Promise<ExchangeTokenResult> =>
  new Promise<ExchangeTokenResult>((resolve) => {
    const controller = new AbortController()
    let isFinished = false
    let isExchanging = false

    const finish = async (result: ExchangeTokenResult): Promise<void> => {
      if (isFinished) {
        return
      }
      isFinished = true
      clearTimeout(timeout)
      controller.abort()
      server.closeAllConnections()
      await closeCallbackServer(server)
      resolve(result)
    }

    const timeout = setTimeout(() => {
      void finish([new Error('Exchange token callback timed out'), null])
    }, CALLBACK_TIMEOUT_MS)

    const rejectRequest = (response: http.ServerResponse, statusCode: number): void => {
      response.writeHead(statusCode, { Connection: 'close', 'Cache-Control': 'no-store' })
      response.end()
    }

    server.on('request', async (request, response) => {
      if (request.headers.host !== `${CALLBACK_HOST}:${port}`) {
        rejectRequest(response, 400)
        return
      }
      const requestUrl = new URL(request.url ?? '/', `http://${CALLBACK_HOST}:${port}`)
      if (requestUrl.pathname !== '/callback') {
        rejectRequest(response, 404)
        return
      }
      if (request.method !== 'GET') {
        rejectRequest(response, 405)
        return
      }
      if (requestUrl.searchParams.get('state') !== state || requestUrl.searchParams.getAll('state').length !== 1) {
        rejectRequest(response, 400)
        return
      }
      const token = requestUrl.searchParams.get('exchangeToken')
      if (!token || requestUrl.searchParams.getAll('exchangeToken').length !== 1) {
        rejectRequest(response, 400)
        return
      }
      if (isExchanging || isFinished) {
        rejectRequest(response, 409)
        return
      }
      isExchanging = true
      const result = await exchangeToken(token, { codeVerifier, signal: controller.signal })
      if (isFinished) {
        return
      }

      // Closing the browser must not discard an already redeemed session.
      if (response.destroyed) {
        void finish(result)
        return
      }
      response.once('close', () => {
        void finish(result)
      })

      // The destination is fixed, and contains neither the code nor the state.
      // Only the completed exchange can send the browser to the success page.
      response.writeHead(303, {
        Location: new URL(`/login/exchange/${result[0] ? 'failure' : 'success'}`, env.VITE_DASHBOARD_URL).toString(),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        Connection: 'close',
      })
      response.end(() => {
        void finish(result)
      })
    })
  })

/** Opens browser authentication and receives the result on an ephemeral loopback port. */
export const getExchangeToken = async (flow: 'login' | 'register'): Promise<TokenResponse | null> => {
  const server = http.createServer()
  const state = randomBytes(32).toString('base64url')
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

  try {
    await listenForCallback(server)
    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Could not determine the login callback port')
    }
    const port = address.port
    const tokenResult = waitForExchangeTokenCallback({ port, server, state, codeVerifier })
    const loginUrl = new URL(`/${flow}`, env.VITE_DASHBOARD_URL)
    loginUrl.search = new URLSearchParams({
      externalRedirect: 'local',
      port: String(port),
      callback: 'redirect',
      state,
      codeChallenge,
    }).toString()
    void shell.openExternal(loginUrl.toString(), { activate: true })

    const [error, data] = await tokenResult
    if (error) {
      console.error(error)
      return null
    }
    return data
  } finally {
    await closeCallbackServer(server)
  }
}
