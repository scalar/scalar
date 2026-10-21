import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, describe, expect, it } from 'vitest'

import { createCodeExample } from './mount'

const instances: Array<{ destroy: () => void }> = []
afterEach(() => {
  instances.splice(0).forEach((instance) => instance.destroy())
  document.body.innerHTML = ''
})

describe('mount-asyncapi', () => {
  it('mounts a payload by operation name and tears down the block', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        servers: {
          first: { host: 'one.example.com', protocol: 'wss' },
          second: { host: 'two.example.com', protocol: 'wss' },
        },
        channels: { events: { address: '/events', messages: { event: { examples: [{ payload: 0 }] } } } },
        operations: { sendEvent: { action: 'send', channel: { $ref: '#/channels/events' } } },
      },
    })
    const element = document.createElement('div')
    document.body.appendChild(element)
    const instance = createCodeExample(element, { store, operationName: 'sendEvent' })
    instances.push(instance)
    expect(element.querySelector('pre')?.textContent?.trim()).toBe('0')
    instance.destroy()
    instances.pop()
    expect(element.textContent).toBe('')
  })

  it('renders payloads for non-WebSocket operations and rejects missing operations', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.0.0',
        info: { title: 'Events', version: '1' },
        servers: { broker: { host: 'broker.example.com', protocol: 'mqtt' } },
        channels: { events: { address: 'events', messages: { event: { examples: [{ payload: 'hello' }] } } } },
        operations: {
          publish: {
            action: 'send',
            channel: { $ref: '#/channels/events' },
            'x-code-samples': [{ lang: 'python', source: 'mqtt.publish("events", "hello")' }],
          },
        },
      },
    })
    const element = document.createElement('div')
    document.body.appendChild(element)
    instances.push(createCodeExample(element, { store, operationName: 'publish' }))
    expect(element.textContent).toContain('hello')
    expect(element.textContent).not.toContain('mqtt.publish')
    expect(element.textContent).not.toContain('JavaScript WebSocket')
    expect(() => createCodeExample(element, { store, operationName: 'missing' })).toThrow(
      'AsyncAPI operation not found: missing',
    )
  })
})
