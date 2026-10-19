import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { UpgradeWebSocket } from 'hono/ws'

import { defaultTransports } from '@/transports'
import type { MessageDirection, MockTransport, TransportContext } from '@/transports/types'
import type { MockServerLogger } from '@/types'
import { authenticateAsyncApiChannel, warnUnsupportedAsyncApiSecurity } from '@/utils/authenticate-asyncapi-channel'
import { generateMessage } from '@/utils/generate-message'
import { processAsyncApiDocument } from '@/utils/process-asyncapi-document'
import { resolveChannels } from '@/utils/resolve-channels'
import { resolveLogger } from '@/utils/resolve-logger'
import { setUpAsyncApiAuthenticationRoutes } from '@/utils/set-up-asyncapi-authentication-routes'

/** Shared options for the AsyncAPI mock application. */
export type AsyncApiMockServerOptions = {
  /**
   * The AsyncAPI 3.1 document to mock. Can be a string (URL or file path), a raw JSON/YAML
   * string, or an already-parsed object.
   */
  document?: string | Record<string, unknown>

  /** Source file path or URL for resolving references in an already loaded document. */
  origin?: string

  /**
   * Additional transports appended after the built-in WebSocket and SSE transports. Use this to
   * support extra protocols (for example SignalR) without changing the core. The first transport
   * whose `supports()` returns `true` for a channel owns it.
   */
  transports?: MockTransport[]

  /** Called for every message flowing in or out of the mock, for logging or inspection. */
  onMessage?: (event: { channel: string; direction: MessageDirection; payload: unknown }) => void

  /**
   * Control the transport lifecycle log lines the server prints. Pass `true` to log them to the
   * console, a `(line) => void` sink to route them elsewhere, or `false` (the default) to stay silent.
   *
   * Diagnostics such as a channel with no matching transport are printed either way.
   */
  logger?: boolean | MockServerLogger
}

/** Options for mounting the mock with a runtime-specific WebSocket adapter. */
export type AsyncApiMockAppOptions = AsyncApiMockServerOptions & {
  /** The adapter must invoke onOpen after accepting the connection to deliver initial samples. */
  upgradeWebSocket: UpgradeWebSocket
}

/** Create AsyncAPI routes using the host runtime's WebSocket adapter. */
export const createAsyncApiMockApp = async (options: AsyncApiMockAppOptions): Promise<Hono> => {
  const app = new Hono()

  const document = await processAsyncApiDocument(options.document, options.origin)
  const channels = resolveChannels(document)

  const transports = [...defaultTransports, ...(options.transports ?? [])]
  const log = resolveLogger(options.logger, false)

  // CORS for the SSE/HTTP routes (WebSocket upgrades are not subject to CORS).
  const corsMiddleware = cors()
  app.use((c, next) => (c.req.header('Upgrade')?.toLowerCase() === 'websocket' ? next() : corsMiddleware(c, next)))

  setUpAsyncApiAuthenticationRoutes(app, document)

  const context: TransportContext = {
    app,
    upgradeWebSocket: options.upgradeWebSocket,
    generateMessage,
    onMessage: options.onMessage,
    log,
  }

  for (const channel of channels) {
    warnUnsupportedAsyncApiSecurity(channel)
    const transport = transports.find((candidate) => candidate.supports(channel))

    if (!transport) {
      // A channel with no matching transport is a configuration problem, so surface it through the
      // console unconditionally rather than the (silenceable) logger.
      console.warn(
        `[asyncapi] no transport for channel "${channel.id}" (protocols: ${channel.protocols.join(', ') || 'none'})`,
      )
      continue
    }

    // An unsecured server on a different protocol cannot authorize this transport.
    const compatibleSecurity = channel.security?.filter(({ protocol }) =>
      transport.supports({ ...channel, protocols: [protocol] }),
    )
    const securedChannel = compatibleSecurity?.length ? { ...channel, security: compatibleSecurity } : channel
    app.use(channel.route, authenticateAsyncApiChannel(securedChannel, defaultTransports.includes(transport)))
    transport.register(channel, context)
    log(`[asyncapi] ${transport.name} -> ${channel.route} (channel "${channel.id}")`)
  }

  return app
}
