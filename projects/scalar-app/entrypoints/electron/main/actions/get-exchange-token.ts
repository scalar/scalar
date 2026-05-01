import http from 'node:http'

import { shell } from 'electron/common'
import { getPort } from 'get-port-please'

import { env } from '@/environment'
import { exchangeToken } from '@/helpers/auth/exchange-token'
import type { TokenResponse } from '@/helpers/auth/schema'

type ExchangeTokenResult = Awaited<ReturnType<typeof exchangeToken>>

const CALLBACK_HOST = '127.0.0.1'
const CALLBACK_TIMEOUT_MS = 3 * 60 * 1000

/**
 * Starts the local callback server on the chosen port.
 * Resolving only after the listening event keeps the browser redirect from
 * racing ahead of the server setup.
 */
const listenForCallback = (server: http.Server, port: number): Promise<void> =>
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
    server.listen({ host: CALLBACK_HOST, port })
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
 * Sends the small JSON payload that the dashboard callback expects.
 * Keeping success and error responses in one place makes the CORS headers
 * consistent across every callback outcome.
 */
const writeCallbackResponse = (
  response: http.ServerResponse,
  {
    corsOrigin,
    message,
    statusCode,
    success,
  }: {
    corsOrigin: string
    message: string
    statusCode: number
    success: boolean
  },
): void => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    Connection: 'close',
  })
  response.end(
    JSON.stringify({
      error: !success,
      message,
      success,
    }),
  )
}

/**
 * Waits for exactly one dashboard callback and exchanges its short-lived token.
 * The server is intentionally one-shot so stale callbacks cannot reuse it.
 */
const waitForExchangeTokenCallback = ({
  port,
  server,
}: {
  port: number
  server: http.Server
}): Promise<ExchangeTokenResult> =>
  new Promise<ExchangeTokenResult>((resolve) => {
    const callbackOrigin = `http://${CALLBACK_HOST}:${port}`
    let isFinished = false

    /**
     * Resolves the callback flow once and closes the local server.
     * The guard prevents a timeout and a request from competing to finish.
     */
    const finish = async (result: ExchangeTokenResult): Promise<void> => {
      if (isFinished) {
        return
      }

      isFinished = true
      clearTimeout(timeout)
      await closeCallbackServer(server)
      resolve(result)
    }

    const timeout = setTimeout(() => {
      void finish([new Error('Exchange token callback timed out'), null])
    }, CALLBACK_TIMEOUT_MS)

    /**
     * Writes a failed callback response before completing the login attempt.
     * The desktop app treats these as a null token result while the browser
     * receives a useful status and message.
     */
    const fail = (response: http.ServerResponse, message: string, statusCode: number): void => {
      writeCallbackResponse(response, {
        corsOrigin: callbackOrigin,
        message,
        statusCode,
        success: false,
      })
      void finish([new Error(message), null])
    }

    server.once('request', async (request, response) => {
      if (request.method !== 'POST') {
        fail(response, 'Method not allowed', 405)
        return
      }

      const requestUrl = new URL(request.url ?? '/', `http://${CALLBACK_HOST}:${port}`)
      const token = requestUrl.searchParams.get('exchangeToken')

      if (!token) {
        fail(response, 'Missing exchange token', 400)
        return
      }

      const result = await exchangeToken(token)
      const [error] = result

      if (error) {
        fail(response, 'Failed to exchange token', 400)
        return
      }

      writeCallbackResponse(response, {
        corsOrigin: callbackOrigin,
        message: 'Token exchanged.',
        statusCode: 200,
        success: true,
      })
      void finish(result)
    })
  })

/**
 * Creates a short-lived local callback server for the desktop login flow.
 * The dashboard sends the exchange token back to this server after browser auth,
 * then the app trades it for the durable access and refresh tokens it needs.
 */
export const getExchangeToken = async (): Promise<TokenResponse | null> => {
  const port = await getPort()
  const server = http.createServer()

  try {
    await listenForCallback(server, port)

    // Arm the callback handler before opening the browser so a fast redirect
    // cannot arrive before the local server is ready to process it.
    const tokenResult = waitForExchangeTokenCallback({ port, server })

    void shell.openExternal(`${env.VITE_DASHBOARD_URL}/login?externalRedirect=local&port=${port}`, { activate: true })

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
