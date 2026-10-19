import { once } from 'node:events'
import { fileURLToPath } from 'node:url'

import galaxyAsyncApiDocument from '@scalar/galaxy/asyncapi/3.0.json'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { unstable_dev } from 'wrangler'

describe('_worker', () => {
  const state: { worker?: Awaited<ReturnType<typeof unstable_dev>> } = {}

  beforeAll(async () => {
    state.worker = await unstable_dev(fileURLToPath(new URL('./_worker.ts', import.meta.url)), {
      ip: '127.0.0.1',
      port: 0,
      inspectorPort: 0,
      compatibilityDate: '2026-04-28',
      compatibilityFlags: ['nodejs_compat'],
      local: true,
      logLevel: 'error',
      experimental: { disableExperimentalWarning: true, disableDevRegistry: true, watch: false },
    })
  }, 60_000)

  afterAll(async () => {
    await state.worker?.stop()
  })

  it.each([
    ['v1', 'planets/4/events', galaxyAsyncApiDocument.components.messages.PlanetCreated],
    ['v2', 'planets/4/events', galaxyAsyncApiDocument.components.messages.PlanetCreated],
    ['v1', 'users/1/events', galaxyAsyncApiDocument.components.messages.UserSignedUp],
    ['v1', 'system/events', galaxyAsyncApiDocument.components.messages.SystemMaintenance],
    ['v1', 'celestial-bodies/events', galaxyAsyncApiDocument.components.messages.CelestialBodyCreated],
  ])('sends a sample immediately on /ws/%s/%s', async (version, channel, messageDefinition) => {
    const ws = new WebSocket(`ws://127.0.0.1:${state.worker!.port}/ws/${version}/${channel}?api_key=demo`)
    try {
      const [message] = await once(ws, 'message', { signal: AbortSignal.timeout(5_000) })
      expect(JSON.parse(message.data)).toStrictEqual(messageDefinition.examples[0]!.payload)
    } finally {
      ws.close()
    }
  })

  it('rejects unauthenticated channel requests', async () => {
    const response = await state.worker!.fetch('/ws/v1/planets/4/events')
    expect(response.status).toBe(401)
    expect(await response.json()).toStrictEqual({
      error: 'Unauthorized',
      message: 'Authentication is required to access this channel.',
    })
  })

  it('keeps REST and API descriptions available', async () => {
    const rest = await state.worker!.fetch('/planets')
    expect(rest.status).toBe(200)
    const openapi = await state.worker!.fetch('/openapi.json')
    expect(openapi.status).toBe(200)
    const events = await fetch(`http://127.0.0.1:${state.worker!.port}/asyncapi.json`)
    expect(events.status).toBe(200)
    const document = (await events.json()) as {
      asyncapi: string
      servers: { production: { host: string } }
      components: { securitySchemes: { oauth2: { flows: { authorizationCode: { tokenUrl: string } } } } }
    }
    expect(document.asyncapi).toBe('3.0.0')
    expect(document.servers.production.host).toBe(`127.0.0.1:${state.worker!.port}`)
    expect(document.components.securitySchemes.oauth2.flows.authorizationCode.tokenUrl).toBe(
      `http://127.0.0.1:${state.worker!.port}/oauth/token`,
    )
    expect((await state.worker!.fetch('/asyncapi.yaml')).status).toBe(200)
  })
})
