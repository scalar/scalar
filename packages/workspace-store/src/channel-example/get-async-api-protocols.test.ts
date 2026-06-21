import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import {
  ALL_PROTOCOLS,
  ALL_SERVERS,
  getAsyncApiProtocols,
  getAsyncApiServerOptions,
  getOperationProtocols,
  getOperationServerNames,
  operationMatchesProtocol,
  operationMatchesServer,
} from '@/channel-example/get-async-api-protocols'

/**
 * Two channels:
 * - `mqttEvents` is pinned to the `mqtt` server only.
 * - `wsChat` declares no servers, so it is reachable over every server.
 */
const document: AsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Mixed Protocol API', version: '1.0.0' },
  servers: {
    websocket: { host: 'api.example.com', protocol: 'wss' },
    mqtt: { host: 'mqtt.example.com', protocol: 'mqtt' },
  },
  channels: {
    mqttEvents: {
      address: 'sensors/{id}',
      servers: [{ $ref: '#/servers/mqtt' }],
    },
    wsChat: { address: '/chat' },
  },
  operations: {
    receiveSensor: { action: 'receive', channel: { $ref: '#/channels/mqttEvents' } },
    sendChat: { action: 'send', channel: { $ref: '#/channels/wsChat' } },
  },
} as unknown as AsyncApiDocument

const operation = (name: keyof NonNullable<AsyncApiDocument['operations']>) => {
  const op = document.operations?.[name]
  if (!op || '$ref' in op) {
    throw new Error(`Expected inline ${String(name)} operation fixture`)
  }
  return op
}

describe('getAsyncApiProtocols', () => {
  it('returns an "All protocols" entry plus each unique server protocol, sorted', () => {
    expect(getAsyncApiProtocols(document)).toEqual([
      { id: ALL_PROTOCOLS, label: 'All protocols' },
      { id: 'mqtt', label: 'MQTT' },
      { id: 'wss', label: 'WSS' },
    ])
  })

  it('returns only the "All protocols" entry when the document has no servers', () => {
    expect(getAsyncApiProtocols({ ...document, servers: undefined })).toEqual([
      { id: ALL_PROTOCOLS, label: 'All protocols' },
    ])
  })
})

describe('getOperationProtocols', () => {
  it('limits an operation to the protocols of the servers its channel is pinned to', () => {
    expect([...getOperationProtocols(document, operation('receiveSensor'))]).toEqual(['mqtt'])
  })

  it('includes every server protocol when the channel declares no servers', () => {
    expect([...getOperationProtocols(document, operation('sendChat')).values()].sort()).toEqual(['mqtt', 'wss'])
  })
})

describe('operationMatchesProtocol', () => {
  it('keeps every operation when no protocol (or "all") is selected', () => {
    expect(operationMatchesProtocol(document, operation('receiveSensor'), undefined)).toBe(true)
    expect(operationMatchesProtocol(document, operation('receiveSensor'), ALL_PROTOCOLS)).toBe(true)
  })

  it('filters out operations whose channel cannot use the selected protocol', () => {
    expect(operationMatchesProtocol(document, operation('receiveSensor'), 'wss')).toBe(false)
    expect(operationMatchesProtocol(document, operation('receiveSensor'), 'mqtt')).toBe(true)
  })
})

describe('getAsyncApiServerOptions', () => {
  it('returns an "All servers" entry plus each server labelled with its protocol', () => {
    expect(getAsyncApiServerOptions(document)).toEqual([
      { id: ALL_SERVERS, label: 'All servers' },
      { id: 'websocket', label: 'websocket (wss)' },
      { id: 'mqtt', label: 'mqtt (mqtt)' },
    ])
  })
})

describe('getOperationServerNames', () => {
  it('limits an operation to the servers its channel is pinned to', () => {
    expect([...getOperationServerNames(document, operation('receiveSensor'))]).toEqual(['mqtt'])
  })

  it('includes every server when the channel declares none', () => {
    expect([...getOperationServerNames(document, operation('sendChat'))].sort()).toEqual(['mqtt', 'websocket'])
  })
})

describe('operationMatchesServer', () => {
  it('keeps every operation when no server (or "all") is selected', () => {
    expect(operationMatchesServer(document, operation('receiveSensor'), undefined)).toBe(true)
    expect(operationMatchesServer(document, operation('receiveSensor'), ALL_SERVERS)).toBe(true)
  })

  it('filters out operations whose channel is not reachable through the selected server', () => {
    expect(operationMatchesServer(document, operation('receiveSensor'), 'websocket')).toBe(false)
    expect(operationMatchesServer(document, operation('receiveSensor'), 'mqtt')).toBe(true)
  })
})
