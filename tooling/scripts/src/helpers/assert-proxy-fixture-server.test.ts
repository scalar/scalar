import { type Server, createServer } from 'node:http'

import { afterEach, describe, expect, it } from 'vitest'

import { assertProxyFixtureServer } from './assert-proxy-fixture-server'

const servers: Server[] = []

const startServer = async (marker?: string, status = 200): Promise<number> => {
  const server = createServer((_request, response) => {
    if (marker) {
      response.setHeader('X-Scalar-Test-Fixture', marker)
    }
    response.writeHead(status)
    response.end('pong')
  })
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP listener')
  }
  return address.port
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections()
          server.close(() => resolve())
        }),
    ),
  )
})

describe('assert-proxy-fixture-server', () => {
  it('accepts a healthy fixture server', async () => {
    await expect(assertProxyFixtureServer(await startServer('1'))).resolves.toBeUndefined()
  })

  it('rejects an ordinary proxy without stopping it', async () => {
    const port = await startServer()
    await expect(assertProxyFixtureServer(port)).rejects.toThrow(
      `Port ${port} is occupied by a server that is not the proxy test harness.`,
    )
    const response = await fetch(`http://127.0.0.1:${port}/ping`)
    expect(await response.text()).toBe('pong')
  })

  it('rejects an unhealthy fixture server', async () => {
    const port = await startServer('1', 503)
    await expect(assertProxyFixtureServer(port)).rejects.toThrow(
      `Port ${port} is occupied by a server that is not the proxy test harness.`,
    )
  })
})
