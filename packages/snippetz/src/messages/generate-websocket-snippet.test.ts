import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { generateWebSocketSnippet } from './generate-websocket-snippet'

describe('generate-websocket-snippet', () => {
  it('waits for open and serializes the selected JSON payload exactly once', () => {
    const listeners: Record<string, () => void> = {}
    const sent: unknown[] = []
    const urls: string[] = []
    class WebSocket {
      constructor(url: string) {
        urls.push(url)
      }
      addEventListener(name: string, listener: () => void): void {
        listeners[name] = listener
      }
      send(value: unknown): void {
        sent.push(value)
      }
    }
    const payload = { text: '\"; throw new Error("injection"); //', enabled: false }
    runInNewContext(generateWebSocketSnippet({ url: 'wss://example.com/events', action: 'send', payload }), {
      WebSocket,
    })
    expect(urls).toEqual(['wss://example.com/events'])
    expect(sent).toEqual([])
    listeners.open?.()
    expect(sent).toEqual([JSON.stringify(payload)])
  })

  it('preserves prototype-named keys in nested authored JSON payloads', () => {
    const payload: unknown = JSON.parse(
      '{"__proto__":{"id":1},"nested":{"__proto__":false},"text":"\\\"__proto__\\\": value"}',
    )
    const listeners: Record<string, () => void> = {}
    const sent: unknown[] = []
    class WebSocket {
      addEventListener(name: string, listener: () => void): void {
        listeners[name] = listener
      }
      send(value: unknown): void {
        sent.push(value)
      }
    }
    runInNewContext(generateWebSocketSnippet({ url: 'wss://example.com', action: 'send', payload }), { WebSocket })
    listeners.open?.()
    expect(sent).toEqual([JSON.stringify(payload)])
  })

  it('sends text without JSON quotes', () => {
    const code = generateWebSocketSnippet({
      url: 'ws://localhost',
      action: 'send',
      payload: 'hello',
      contentType: 'text/plain',
    })
    expect(code).toContain('socket.send(payload)')
    expect(code).toContain('const payload = "hello"')
  })

  it('preserves a null JSON example', () => {
    expect(generateWebSocketSnippet({ url: 'wss://example.com', action: 'send', payload: null })).toContain(
      'const payload = null',
    )
  })

  it('listens for incoming messages without reversing the operation direction', () => {
    const code = generateWebSocketSnippet({
      url: 'wss://example.com',
      action: 'receive',
      payload: { event: 'updated' },
    })
    expect(code).toBe(`const socket = new WebSocket("wss://example.com")

socket.addEventListener("message", (event) => {
  console.log(event.data)

  // Example incoming payload:
  // {
  //   "event": "updated"
  // }
})`)
  })

  it('marks missing payloads explicitly', () => {
    const code = generateWebSocketSnippet({
      url: 'wss://example.com',
      action: 'send',
    })
    expect(code).toContain('const payload = "YOUR_MESSAGE"')
  })
})
