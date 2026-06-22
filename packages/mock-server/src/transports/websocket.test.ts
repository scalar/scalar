import { describe, expect, it, vi } from 'vitest'

import { generateMessage } from '@/utils/generate-message'

import type { ResolvedChannel, TransportContext } from './types'
import { websocketTransport } from './websocket'

/** A channel with both a receive (push) and a send (echo) operation. */
const channel: ResolvedChannel = {
  id: 'echo',
  address: 'echo',
  route: '/echo',
  protocols: ['ws'],
  messages: [
    {
      id: 'message',
      payload: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } as any,
      examples: [],
      contentType: 'application/json',
    },
  ],
  operations: [
    { id: 'send', action: 'send', messages: [] },
    { id: 'receive', action: 'receive', messages: [] },
  ],
}

// Operations reference the same single message.
channel.operations[0]!.messages = channel.messages
channel.operations[1]!.messages = channel.messages

/** Register the transport against fakes and return the captured WebSocket event handlers. */
function register(target: ResolvedChannel = channel) {
  let handlers: any
  const context: TransportContext = {
    app: {
      get: (_route: string, _handler: unknown) => undefined,
    } as any,
    upgradeWebSocket: ((createHandlers: any) => {
      handlers = createHandlers({})
      return 'WS_ROUTE_HANDLER'
    }) as any,
    generateMessage,
    onMessage: vi.fn(),
    log: vi.fn(),
  }

  websocketTransport.register(target, context)
  return { handlers, onMessage: context.onMessage as ReturnType<typeof vi.fn> }
}

describe('websocketTransport', () => {
  it('supports ws/wss channels only', () => {
    expect(websocketTransport.supports({ ...channel, protocols: ['ws'] })).toBe(true)
    expect(websocketTransport.supports({ ...channel, protocols: ['wss'] })).toBe(true)
    expect(websocketTransport.supports({ ...channel, protocols: ['sse'] })).toBe(false)
  })

  it('pushes a generated message on open for receive operations', () => {
    const { handlers, onMessage } = register()
    const sent: string[] = []
    const ws = { send: (data: string) => sent.push(data) }

    handlers.onOpen({}, ws)

    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0]!)).toHaveProperty('text')
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ channel: 'echo', direction: 'out' }))
  })

  it('echoes a generated reply on inbound messages for send operations', () => {
    const { handlers, onMessage } = register()
    const sent: string[] = []
    const ws = { send: (data: string) => sent.push(data) }

    handlers.onMessage({ data: '{"text":"hi"}' }, ws)

    // One inbound notification + one outbound echo.
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ direction: 'in', payload: '{"text":"hi"}' }))
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0]!)).toHaveProperty('text')
  })

  it('does not echo inbound messages on receive-only channels', () => {
    // A channel with only a receive (push) operation should stay quiet on inbound frames.
    const receiveOnly: ResolvedChannel = {
      ...channel,
      operations: [{ id: 'receive', action: 'receive', messages: channel.messages }],
    }
    const { handlers, onMessage } = register(receiveOnly)
    const sent: string[] = []
    const ws = { send: (data: string) => sent.push(data) }

    handlers.onMessage({ data: '{"text":"hi"}' }, ws)

    expect(sent).toHaveLength(0)
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ direction: 'in', payload: '{"text":"hi"}' }))
    expect(onMessage).not.toHaveBeenCalledWith(expect.objectContaining({ direction: 'out' }))
  })
})
