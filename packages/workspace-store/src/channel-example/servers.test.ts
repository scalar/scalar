import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getAsyncApiServers, getSelectedAsyncApiServer } from '@/channel-example/servers'

const galaxyAsyncApiDocument: AsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Scalar Galaxy Events', version: '1.0.0' },
  'x-scalar-original-document-hash': 'galaxy-fixture',
  servers: {
    production: {
      host: 'galaxy.scalar.com',
      protocol: 'wss',
      description: 'Production WebSocket server',
    },
    development: {
      host: 'localhost:8080',
      protocol: 'ws',
      description: 'Local development server',
    },
    kafka: {
      host: 'kafka.example.com:9092',
      protocol: 'kafka',
      description: 'Unsupported for WebSocket MVP',
    },
  },
  channels: {
    planetEvents: {
      address: 'planets/{planetId}/events',
      bindings: {
        ws: {
          method: 'GET',
          query: {
            type: 'object',
            properties: {
              includeHistory: { type: 'boolean', default: false },
            },
          },
        },
      },
    },
  },
} as AsyncApiDocument

const chatAsyncApiDocument: AsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Simple Chat WebSocket API', version: '1.0.0' },
  'x-scalar-original-document-hash': 'chat-fixture',
  servers: {
    production: {
      host: 'api.example.com',
      protocol: 'wss',
      description: 'Production WebSocket server',
    },
  },
  channels: {
    chat: { address: '/chat' },
  },
}

describe('getAsyncApiServers', () => {
  it('returns WebSocket servers with base url and connectionUrl when channel is provided', () => {
    const channel = galaxyAsyncApiDocument.channels?.planetEvents
    if (!channel || '$ref' in channel) {
      throw new Error('Expected inline planetEvents channel fixture')
    }

    const servers = getAsyncApiServers(galaxyAsyncApiDocument, {
      channel,
      pathParameters: { planetId: 'abc-123-def' },
    })

    expect(servers).toHaveLength(2)
    expect(servers.map(({ name }) => name)).toEqual(['production', 'development'])
    expect(servers[0]).toMatchObject({
      name: 'production',
      protocol: 'wss',
      url: 'wss://galaxy.scalar.com',
      connectionUrl: 'wss://galaxy.scalar.com/planets/abc-123-def/events?includeHistory=false',
      isWebSocket: true,
    })
    expect(servers[1]?.url).toBe('ws://localhost:8080')
  })

  it('can include non-WebSocket protocols when webSocketOnly is false', () => {
    const servers = getAsyncApiServers(galaxyAsyncApiDocument, { webSocketOnly: false })

    expect(servers).toHaveLength(3)
    expect(servers.find(({ name }) => name === 'kafka')?.isWebSocket).toBe(false)
  })

  it('restricts servers to channel.servers references', () => {
    const developmentServer = galaxyAsyncApiDocument.servers?.development
    if (!developmentServer || '$ref' in developmentServer) {
      throw new Error('Expected inline development server fixture')
    }

    const document = {
      ...galaxyAsyncApiDocument,
      channels: {
        restricted: {
          address: '/restricted',
          servers: [
            {
              $ref: '#/servers/development',
              '$ref-value': developmentServer,
            },
          ],
        },
      },
    } as unknown as AsyncApiDocument

    const channel = document.channels?.restricted
    if (!channel || '$ref' in channel) {
      throw new Error('Expected inline restricted channel fixture')
    }

    const servers = getAsyncApiServers(document, { channel })

    expect(servers.map(({ name, connectionUrl }) => ({ name, connectionUrl }))).toStrictEqual([
      {
        name: 'development',
        connectionUrl: 'ws://localhost:8080/restricted',
      },
    ])
  })

  it('builds chat fixture connection URLs', () => {
    const channel = chatAsyncApiDocument.channels?.chat
    if (!channel || '$ref' in channel) {
      throw new Error('Expected inline chat channel fixture')
    }

    const servers = getAsyncApiServers(chatAsyncApiDocument, { channel })

    expect(servers).toHaveLength(1)
    expect(servers[0]?.connectionUrl).toBe('wss://api.example.com/chat')
  })
})

describe('getSelectedAsyncApiServer', () => {
  it('returns the first server when no selection extension is set', () => {
    const servers = getAsyncApiServers(galaxyAsyncApiDocument)

    expect(getSelectedAsyncApiServer(galaxyAsyncApiDocument, servers)?.name).toBe('production')
  })

  it('returns the server matching x-scalar-selected-server', () => {
    const document: AsyncApiDocument = {
      ...galaxyAsyncApiDocument,
      'x-scalar-selected-server': 'development',
    }
    const servers = getAsyncApiServers(document)

    expect(getSelectedAsyncApiServer(document, servers)?.name).toBe('development')
  })

  it('falls back to the first server when the selection does not match', () => {
    const document: AsyncApiDocument = {
      ...galaxyAsyncApiDocument,
      'x-scalar-selected-server': 'missing',
    }
    const servers = getAsyncApiServers(document)

    expect(getSelectedAsyncApiServer(document, servers)?.name).toBe('production')
  })
})
