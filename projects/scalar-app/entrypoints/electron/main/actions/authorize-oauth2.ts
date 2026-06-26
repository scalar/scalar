import http from 'node:http'

import { shell } from 'electron/common'
import { BrowserWindow } from 'electron/main'
import { getPort } from 'get-port-please'

/** Loopback interface for the OAuth2 redirect, per RFC 8252 section 7.3. */
const CALLBACK_HOST = '127.0.0.1'
const CALLBACK_PATH = '/callback'
const CALLBACK_TIMEOUT_MS = 3 * 60 * 1000

type AuthorizeOAuth2Params = {
  /** The fully built authorization URL, without a `redirect_uri` parameter. */
  authorizationUrl: string
}

type AuthorizeOAuth2Result =
  | {
      /** The full callback URL the provider redirected to, including query params. */
      callbackUrl: string
      /** The exact `redirect_uri` used, so the renderer can match it in the token exchange. */
      redirectUri: string
    }
  | { error: string }

/**
 * Minimal page served once the provider redirects back. Doubles as a fragment
 * relay: implicit flows return the token in the URL fragment, which browsers do
 * not send to the server, so the page copies the fragment into a query-string
 * redirect to the same path where the server can finally read it.
 */
const CALLBACK_PAGE = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Scalar</title></head>
  <body style="font-family: system-ui, sans-serif; padding: 2rem;">
    <p id="message">Finishing authorization…</p>
    <script>
      var hash = window.location.hash.slice(1)
      if (hash) {
        window.location.replace('${CALLBACK_PATH}?' + hash)
      } else {
        document.getElementById('message').textContent = 'You can close this window now.'
      }
    </script>
  </body>
</html>`

/**
 * Starts the loopback server, resolving only after the `listening` event so the
 * browser redirect cannot race ahead of the server being ready.
 */
const listenForCallback = (server: http.Server, port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off('listening', onListening)
      reject(error)
    }
    const onListening = () => {
      server.off('error', onError)
      resolve()
    }

    server.once('error', onError)
    server.once('listening', onListening)
    server.listen({ host: CALLBACK_HOST, port })
  })

/**
 * Waits for the loopback server to stop accepting connections. `server.close()`
 * is asynchronous, so callers await this before treating the flow as cleaned up.
 */
const closeCallbackServer = (server: http.Server): Promise<void> =>
  new Promise((resolve) => {
    if (!server.listening) {
      resolve()
      return
    }

    server.close(() => resolve())
  })

/** Returns true once a callback carries an authorization code, token, or error. */
const hasCallbackParams = (params: URLSearchParams): boolean =>
  params.has('code') || params.has('access_token') || params.has('error')

/** Refocuses the app window after the user returns from the external browser. */
const focusAppWindow = (): void => {
  const [mainWindow] = BrowserWindow.getAllWindows()
  if (!mainWindow) {
    return
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.focus()
}

/**
 * Runs an interactive OAuth2 authorization for the desktop app.
 *
 * The renderer builds the authorization URL (including PKCE and state) but leaves
 * out the `redirect_uri`, because only the main process knows the ephemeral
 * loopback port. We append the `redirect_uri`, open the system browser (the
 * external user-agent recommended by RFC 8252), and resolve once the provider
 * redirects back to the loopback server.
 */
export const authorizeOauth2 = async ({ authorizationUrl }: AuthorizeOAuth2Params): Promise<AuthorizeOAuth2Result> => {
  let port: number
  let authUrl: URL
  let redirectUri: string

  try {
    port = await getPort({ host: CALLBACK_HOST })
    redirectUri = `http://${CALLBACK_HOST}:${port}${CALLBACK_PATH}`
    authUrl = new URL(authorizationUrl)
    authUrl.searchParams.set('redirect_uri', redirectUri)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to prepare the OAuth2 redirect' }
  }

  const server = http.createServer()

  try {
    await listenForCallback(server, port)

    const result = await new Promise<AuthorizeOAuth2Result>((resolve) => {
      let isFinished = false

      const finish = (value: AuthorizeOAuth2Result): void => {
        if (isFinished) {
          return
        }
        isFinished = true
        clearTimeout(timeout)
        resolve(value)
      }

      const timeout = setTimeout(() => {
        finish({ error: 'OAuth2 authorization timed out' })
      }, CALLBACK_TIMEOUT_MS)

      server.on('request', (request, response) => {
        const requestUrl = new URL(request.url ?? '/', `http://${CALLBACK_HOST}:${port}`)

        // Ignore unrelated requests (for example the browser's favicon probe).
        if (requestUrl.pathname !== CALLBACK_PATH) {
          response.writeHead(404, { Connection: 'close' })
          response.end()
          return
        }

        response.writeHead(200, { 'Content-Type': 'text/html', Connection: 'close' })
        response.end(CALLBACK_PAGE)

        // No params yet means an implicit fragment response: the relay page will
        // redirect back with the params in the query string, so keep waiting.
        if (!hasCallbackParams(requestUrl.searchParams)) {
          return
        }

        finish({ callbackUrl: requestUrl.toString(), redirectUri })
      })

      // Arm the handler before opening the browser so a fast redirect cannot
      // arrive before the server is ready to process it.
      void shell.openExternal(authUrl.toString(), { activate: true })
    })

    if ('callbackUrl' in result) {
      focusAppWindow()
    }

    return result
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to authorize the OAuth2 flow' }
  } finally {
    await closeCallbackServer(server)
  }
}
