import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { defaultTransports } from '@/transports'
import type { TransportContext } from '@/transports/types'
import type { MockServerOptions } from '@/types'
import { authenticateAsyncApiChannel, warnUnsupportedAsyncApiSecurity } from '@/utils/authenticate-asyncapi-channel'
import { generateMessage } from '@/utils/generate-message'
import { resolveChannels } from '@/utils/resolve-channels'
import { resolveLogger } from '@/utils/resolve-logger'
import { setUpAsyncApiAuthenticationRoutes } from '@/utils/set-up-asyncapi-authentication-routes'

/** Register the AsyncAPI channels on the selected runtime's adapter. */
export const createAsyncApiMockServer = (options: MockServerOptions, document: AsyncApiDocument): Hono => {
  const app = new Hono()

  const channels = resolveChannels(document)

  const transports = [...defaultTransports, ...(options.transports ?? [])]
  const log = resolveLogger(options.logger, false)

  // CORS for the SSE/HTTP routes (WebSocket upgrades are not subject to CORS).
  const corsMiddleware = cors()
  app.use((c, next) => (c.req.header('Upgrade')?.toLowerCase() === 'websocket' ? next() : corsMiddleware(c, next)))

  setUpAsyncApiAuthenticationRoutes(app, document)

  const context: TransportContext = {
    app,
    upgradeWebSocket:
      options.upgradeWebSocket ??
      (() => {
        throw new Error(
          'AsyncAPI WebSocket channels require an upgradeWebSocket adapter. Pass the adapter for your runtime to createMockServer().',
        )
      }),
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
