import { describe, expect, it } from 'vitest'

import { generateMessageSnippet } from './index'

describe('generate-message-snippet', () => {
  it('generates a JavaScript WebSocket send example through the public entry point', () => {
    const code = generateMessageSnippet({
      protocol: 'websocket',
      language: 'javascript',
      url: 'wss://example.com/events',
      action: 'send',
      payload: { name: 'Ada' },
    })
    expect(code).toContain('new WebSocket("wss://example.com/events")')
    expect(code).toContain('"name": "Ada"')
    expect(code).toContain('socket.send(JSON.stringify(payload))')
  })

  it('rejects unsupported protocols instead of generating WebSocket code', () => {
    expect(() =>
      generateMessageSnippet({
        // @ts-expect-error MQTT is not supported yet; JavaScript callers also receive an error.
        protocol: 'mqtt',
        language: 'javascript',
        url: 'mqtt://example.com',
        action: 'send',
      }),
    ).toThrow('Unsupported message snippet protocol or language')
  })

  it('rejects unsupported languages instead of generating JavaScript', () => {
    expect(() =>
      generateMessageSnippet({
        protocol: 'websocket',
        // @ts-expect-error Python is not supported yet; JavaScript callers also receive an error.
        language: 'python',
        url: 'wss://example.com',
        action: 'receive',
      }),
    ).toThrow('Unsupported message snippet protocol or language')
  })
})
