import { type WebSocketServerLike, upgradeWebSocket } from '@hono/node-server'
import type { Hono } from 'hono'
import { WebSocketServer } from 'ws'

import { type AsyncApiMockServerOptions, createAsyncApiMockApp } from './create-asyncapi-mock-app'

/** The result of {@link createAsyncApiMockServer}. */
export type AsyncApiMockServer = {
  /** The Hono app serving SSE channels and WebSocket upgrade routes. */
  app: Hono
  /** Pass this option to `@hono/node-server`'s `serve()` to enable WebSocket channels. */
  websocket: { server: WebSocketServerLike }
}

/**
 * Create a mock server for an AsyncAPI 3.1 document — the event-driven counterpart of
 * {@link createMockServer}. Each channel is registered on a transport (WebSocket or SSE by
 * default) that emits realistic mock messages generated from the channel's message payload
 * schemas, the same way the REST mocker generates HTTP response bodies.
 *
 * Pass the returned WebSocket option to `serve()`:
 *
 * ```ts
 * const { app, websocket } = await createAsyncApiMockServer({ document })
 * serve({ fetch: app.fetch, port: 3000, websocket })
 * ```
 */
export const createAsyncApiMockServer = async (options: AsyncApiMockServerOptions): Promise<AsyncApiMockServer> => {
  const app = await createAsyncApiMockApp({ ...options, upgradeWebSocket })
  return { app, websocket: { server: new WebSocketServer({ noServer: true }) } }
}
