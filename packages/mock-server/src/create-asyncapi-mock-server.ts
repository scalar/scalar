import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { defaultTransports } from '@/transports'
import type { MessageDirection, MockTransport, TransportContext } from '@/transports/types'
import type { MockServerLogger } from '@/types'
import { generateMessage } from '@/utils/generate-message'
import { processAsyncApiDocument } from '@/utils/process-asyncapi-document'
import { resolveChannels } from '@/utils/resolve-channels'
import { resolveLogger } from '@/utils/resolve-logger'

/** Options for {@link createAsyncApiMockServer}. */
export type AsyncApiMockServerOptions = {
  /**
   * The AsyncAPI 3.1 document to mock. Can be a string (URL or file path), a raw JSON/YAML
   * string, or an already-parsed object.
   */
  document?: string | Record<string, any>

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

/** The result of {@link createAsyncApiMockServer}. */
export type AsyncApiMockServer = {
  /** The Hono app serving SSE channels and WebSocket upgrade routes. */
  app: Hono
  /**
   * Attaches WebSocket handling to the running Node HTTP server returned by `@hono/node-server`'s
   * `serve()`. Must be called for WebSocket channels to accept connections.
   */
  injectWebSocket: ReturnType<typeof createNodeWebSocket>['injectWebSocket']
}

/**
 * Create a mock server for an AsyncAPI 3.1 document — the event-driven counterpart of
 * {@link createMockServer}. Each channel is registered on a transport (WebSocket or SSE by
 * default) that emits realistic mock messages generated from the channel's message payload
 * schemas, the same way the REST mocker generates HTTP response bodies.
 *
 * WebSocket support requires attaching to the HTTP server after `serve()`:
 *
 * ```ts
 * const { app, injectWebSocket } = await createAsyncApiMockServer({ document })
 * const server = serve({ fetch: app.fetch, port: 3000 })
 * injectWebSocket(server)
 * ```
 */
export async function createAsyncApiMockServer(options: AsyncApiMockServerOptions): Promise<AsyncApiMockServer> {
  const app = new Hono()

  // The Node WebSocket adapter must be created against the app before routes are registered so the
  // `upgradeWebSocket` helper shares this app's lifecycle. `injectWebSocket` is wired to the
  // HTTP server by the caller after `serve()`.
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

  const document = await processAsyncApiDocument(options.document)
  const channels = resolveChannels(document)

  const transports = [...defaultTransports, ...(options.transports ?? [])]
  const log = resolveLogger(options.logger, false)

  // CORS for the SSE/HTTP routes (WebSocket upgrades are not subject to CORS).
  app.use(cors())

  const context: TransportContext = {
    app,
    upgradeWebSocket,
    generateMessage,
    onMessage: options.onMessage,
    log,
  }

  for (const channel of channels) {
    const transport = transports.find((candidate) => candidate.supports(channel))

    if (!transport) {
      // A channel with no matching transport is a configuration problem, so surface it through the
      // console unconditionally rather than the (silenceable) logger.
      console.warn(
        `[asyncapi] no transport for channel "${channel.id}" (protocols: ${channel.protocols.join(', ') || 'none'})`,
      )
      continue
    }

    transport.register(channel, context)
    log(`[asyncapi] ${transport.name} -> ${channel.route} (channel "${channel.id}")`)
  }

  return { app, injectWebSocket }
}
