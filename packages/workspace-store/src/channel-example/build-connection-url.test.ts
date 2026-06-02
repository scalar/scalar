import type { AsyncApiChannelObject, AsyncApiOperationObject, AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import {
  buildAsyncApiServerBaseUrl,
  buildConnectionUrl,
  buildWsQueryParams,
  getAsyncApiServerVariables,
  mergeWsBindings,
} from '@/channel-example/build-connection-url'

const galaxyProductionServer: AsyncApiServerObject = {
  host: 'galaxy.scalar.com',
  protocol: 'wss',
  description: 'Production WebSocket server for real-time events',
}

const galaxyPlanetEventsChannel: AsyncApiChannelObject = {
  address: 'planets/{planetId}/events',
  bindings: {
    ws: {
      method: 'GET',
      query: {
        type: 'object',
        properties: {
          includeHistory: {
            type: 'boolean',
            default: false,
          },
          eventTypes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  },
}

const galaxySubscribeToPlanetEvents = {
  action: 'receive',
  bindings: {
    ws: {
      bindingVersion: '0.1.0',
      method: 'GET',
    },
  },
} as AsyncApiOperationObject

const chatProductionServer: AsyncApiServerObject = {
  host: 'api.example.com',
  protocol: 'wss',
  description: 'Production WebSocket server',
}

const chatChannel: AsyncApiChannelObject = {
  address: '/chat',
}

describe('getAsyncApiServerVariables', () => {
  it('extracts default values from server variables', () => {
    const server: AsyncApiServerObject = {
      host: '{environment}.example.com',
      protocol: 'wss',
      variables: {
        environment: {
          default: 'production',
          description: 'Deployment environment',
        },
      },
    }

    expect(getAsyncApiServerVariables(server)).toEqual({ environment: 'production' })
  })
})

describe('buildAsyncApiServerBaseUrl', () => {
  it('builds scheme, host, and pathname with substitutions', () => {
    const server: AsyncApiServerObject = {
      host: '{environment}.example.com:8080',
      protocol: 'wss',
      pathname: '/v1/{tenant}',
      variables: {
        environment: { default: 'galaxy' },
        tenant: { default: 'acme' },
      },
    }

    expect(buildAsyncApiServerBaseUrl(server)).toBe('wss://galaxy.example.com:8080/v1/acme')
  })

  it('substitutes environment variables in host and pathname', () => {
    const server: AsyncApiServerObject = {
      host: '{{host}}',
      protocol: 'ws',
      pathname: '/{{basePath}}',
    }

    expect(
      buildAsyncApiServerBaseUrl(server, {
        host: 'localhost:8080',
        basePath: 'api',
      }),
    ).toBe('ws://localhost:8080/api')
  })
})

describe('buildWsQueryParams', () => {
  it('applies JSON Schema defaults from ws query binding', () => {
    const params = buildWsQueryParams(mergeWsBindings(galaxyPlanetEventsChannel, galaxySubscribeToPlanetEvents))

    expect(params.toString()).toBe('includeHistory=false')
  })

  it('lets explicit query parameters override schema defaults', () => {
    const params = buildWsQueryParams(mergeWsBindings(galaxyPlanetEventsChannel, null), {
      includeHistory: 'true',
    })

    expect(params.toString()).toBe('includeHistory=true')
  })
})

describe('buildConnectionUrl', () => {
  it('builds Galaxy-style planet events URL with query defaults', () => {
    const url = buildConnectionUrl({
      server: galaxyProductionServer,
      channel: galaxyPlanetEventsChannel,
      operation: galaxySubscribeToPlanetEvents,
    })

    expect(url).toBe('wss://galaxy.scalar.com/planets/{planetId}/events?includeHistory=false')
  })

  it('substitutes channel path parameters', () => {
    const url = buildConnectionUrl({
      server: galaxyProductionServer,
      channel: galaxyPlanetEventsChannel,
      operation: galaxySubscribeToPlanetEvents,
      pathParameters: { planetId: 'abc-123-def' },
    })

    expect(url).toBe('wss://galaxy.scalar.com/planets/abc-123-def/events?includeHistory=false')
  })

  it('builds chat fixture production URL', () => {
    const url = buildConnectionUrl({
      server: chatProductionServer,
      channel: chatChannel,
    })

    expect(url).toBe('wss://api.example.com/chat')
  })

  it('merges server pathname and channel address', () => {
    const url = buildConnectionUrl({
      server: {
        host: 'api.example.com',
        protocol: 'wss',
        pathname: '/realtime',
      },
      channel: { address: 'events/{id}' },
      pathParameters: { id: '42' },
    })

    expect(url).toBe('wss://api.example.com/realtime/events/42')
  })
})
