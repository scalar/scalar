import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiOperation } from '@scalar/workspace-store/schemas/navigation'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import Operation from './Operation.vue'

const OPERATION_ID = 'doc/channel/userSignedUp/operation/onUserSignedUp'

function createOperation(overrides: Partial<TraversedAsyncApiOperation> = {}): TraversedAsyncApiOperation {
  return {
    type: 'asyncapi-operation',
    id: OPERATION_ID,
    title: 'On user signed up',
    operationName: 'onUserSignedUp',
    action: 'receive',
    channelName: 'userSignedUp',
    channelAddress: 'user/signedup',
    ...overrides,
  }
}

function createDocument(operation: Record<string, unknown>): AsyncApiDocument {
  return {
    asyncapi: '3.0.0',
    info: { title: 'Streaming API', version: '1.0.0' },
    'x-scalar-original-document-hash': '',
    channels: {
      userSignedUp: { address: 'user/signedup' },
    },
    operations: { onUserSignedUp: operation },
  } as unknown as AsyncApiDocument
}

enableAutoUnmount(afterEach)

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Operation', () => {
  it.each([
    { title: 'Event title', summary: 'Event summary', description: 'Event description', heading: 'Event title' },
    { title: 'Event title', summary: 'Event summary', description: undefined, heading: 'Event title' },
    { title: 'Event title', summary: undefined, description: 'Event description', heading: 'Event title' },
    { title: 'Event title', summary: undefined, description: undefined, heading: 'Event title' },
    { title: undefined, summary: 'Event summary', description: 'Event description', heading: 'Event summary' },
    { title: undefined, summary: 'Event summary', description: undefined, heading: 'Event summary' },
    { title: undefined, summary: undefined, description: 'Event description', heading: 'onUserSignedUp' },
    { title: undefined, summary: undefined, description: undefined, heading: 'onUserSignedUp' },
    { title: '  ', summary: '  Event summary  ', description: 'Event description', heading: 'Event summary' },
    { title: 'Event title', summary: '  ', description: 'Event description', heading: 'Event title' },
  ])('renders metadata once with $title, $summary, and $description', ({ title, summary, description, heading }) => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation({ title: 'onUserSignedUp' }),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          title,
          summary,
          description,
        }),
        eventBus: null,
      },
    })

    expect(wrapper.get('h1, h2, h3, h4, h5, h6').text()).toBe(heading)
    for (const value of [title, summary, description]) {
      if (value?.trim()) {
        expect(wrapper.text().split(value.trim()).length - 1).toBe(1)
      }
    }
  })

  it.each([false, true])('renders trait metadata with local overrides: %s', (override) => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation({ title: 'onUserSignedUp' }),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          traits: [
            { title: 'Initial title', summary: 'Initial summary', description: 'Initial description' },
            {
              $ref: '#/components/operationTraits/prose',
              '$ref-value': { title: 'Trait title', summary: 'Trait summary', description: 'Trait description' },
            },
          ],
          ...(override ? { title: 'Local title', summary: 'Local summary', description: 'Local description' } : {}),
        }),
        eventBus: null,
      },
    })

    const source = override ? 'Local' : 'Trait'
    expect(wrapper.get('h1, h2, h3, h4, h5, h6').text()).toBe(`${source} title`)
    for (const field of ['title', 'summary', 'description']) {
      expect(wrapper.text().split(`${source} ${field}`).length - 1).toBe(1)
      expect(wrapper.text().includes(`Initial ${field}`)).toBe(false)
      if (override) {
        expect(wrapper.text().includes(`Trait ${field}`)).toBe(false)
      }
    }
  })

  it('uses an inherited summary as the heading without repeating it', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation({ title: 'onUserSignedUp' }),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          traits: [{ summary: 'Inherited summary', description: 'Inherited description' }],
        }),
        eventBus: null,
      },
    })
    expect(wrapper.get('h1, h2, h3, h4, h5, h6').text()).toBe('Inherited summary')
    expect(wrapper.text().split('Inherited summary').length - 1).toBe(1)
    expect(wrapper.text().includes('Inherited description')).toBe(true)
  })

  it.each([1, 2])('starts all %i messages collapsed', (count) => {
    const messages = Array.from({ length: count }, (_, index) => ({
      type: 'asyncapi-message' as const,
      id: `message-${index}`,
      title: `Message ${index}`,
      messageName: `message${index}`,
      channelName: 'userSignedUp',
    }))
    const document = createDocument({ action: 'receive', channel: { $ref: '#/channels/userSignedUp' } })
    document.channels = {
      userSignedUp: {
        address: 'users',
        messages: Object.fromEntries(
          messages.map((message) => [message.messageName, { description: `Details for ${message.title}` }]),
        ),
      },
    }
    const wrapper = mount(Operation, {
      props: { operation: createOperation({ children: messages }), document, eventBus: null },
    })
    expect(
      wrapper.findAll('button.collapsible-section-toggle').map((button) => button.attributes('aria-expanded')),
    ).toStrictEqual(messages.map(() => 'false'))
    expect(wrapper.text()).not.toContain('Details for Message 0')
  })

  it('renders inherited operation bindings without messages', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        eventBus: null,
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          traits: [{ bindings: { kafka: { bindingVersion: '0.5.0' } } }],
        }),
      },
    })
    expect(wrapper.text()).toContain('Bindings')
    expect(wrapper.text()).toContain('0.5.0')
  })

  it('keeps Messages before Replies when the operation has no listed messages', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          reply: { channel: { $ref: '#/channels/userSignedUp' } },
        }),
        eventBus: null,
      },
    })
    expect(wrapper.text()).toContain('No messages listed for this operation.')
    const headings = wrapper.findAll('h1, h2, h3, h4, h5, h6').map((heading) => heading.text())
    expect(headings).toStrictEqual(['On user signed up', 'Messages', 'Replies'])
  })

  it('does not add a reply empty state to operations without replies', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document: createDocument({ action: 'receive', channel: { $ref: '#/channels/userSignedUp' } }),
        eventBus: null,
      },
    })
    expect(wrapper.text()).not.toContain('No messages listed for this operation.')
  })

  it('renders the operation title and the action badge', () => {
    const wrapper = mount(Operation, {
      attachTo: document.body,
      props: {
        operation: createOperation(),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('On user signed up')
    expect(wrapper.find('.operation-action').text()).toBe('Receive')
  })

  it('renders the send action badge', () => {
    const wrapper = mount(Operation, {
      attachTo: document.body,
      props: {
        operation: createOperation({ action: 'send' }),
        document: createDocument({ action: 'send', channel: { $ref: '#/channels/userSignedUp' } }),
        eventBus: null,
      },
    })

    expect(wrapper.find('.operation-action').text()).toBe('Send')
  })

  it('renders the operation description (the operation header is not collapsible)', () => {
    const wrapper = mount(Operation, {
      attachTo: document.body,
      props: {
        operation: createOperation(),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          description: 'Fired whenever a user signs up.',
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Fired whenever a user signs up.')
  })

  it('shows required OAuth scopes in the authentication tooltip', async () => {
    const wrapper = mount(Operation, {
      attachTo: document.body,
      props: {
        operation: createOperation(),
        document: {
          asyncapi: '3.0.0',
          info: { title: 'Streaming API', version: '1.0.0' },
          'x-scalar-original-document-hash': '',
          components: { securitySchemes: { oauth2: { type: 'oauth2', flows: {} } } },
          channels: { userSignedUp: { address: 'user/signedup' } },
          operations: {
            onUserSignedUp: {
              action: 'receive',
              channel: { $ref: '#/channels/userSignedUp' },
              security: [{ type: 'oauth2', flows: {}, scopes: ['read:events'] }],
            },
          },
        } as unknown as AsyncApiDocument,
        eventBus: null,
      },
    })

    expect(wrapper.text()).not.toContain('read:events')
    await wrapper.get('button[aria-haspopup="dialog"]').trigger('click')
    expect(document.body.textContent).toContain('Authentication required')
    expect(document.body.textContent).toContain('read:events')
    wrapper.unmount()
  })

  it('documents scope-free inline alternatives alongside OAuth scopes without server security', async () => {
    const wrapper = mount(Operation, {
      attachTo: document.body,
      props: {
        operation: createOperation(),
        document: {
          ...createDocument({
            action: 'receive',
            channel: { $ref: '#/channels/userSignedUp' },
            security: [
              { type: 'oauth2', flows: {}, scopes: ['read:events'] },
              { type: 'httpApiKey', name: 'X-Events-Key', in: 'header', description: 'Event subscription key' },
            ],
          }),
          servers: {
            main: {
              host: 'example.com',
              protocol: 'wss',
              security: [{ type: 'http', scheme: 'bearer', description: 'Connection credential' }],
            },
          },
        },
        eventBus: null,
      },
    })
    await wrapper.get('button[aria-haspopup="dialog"]').trigger('click')
    expect(document.body.textContent).toContain('read:events')
    expect(document.body.textContent).toContain('X-Events-Key')
    expect(document.body.textContent).toContain('Event subscription key')
    expect(document.body.textContent).toContain('one of')
    expect(document.body.textContent).not.toContain('Connection credential')
    wrapper.unmount()
  })

  it('renders a message accordion for each message child', () => {
    const wrapper = mount(Operation, {
      attachTo: document.body,
      props: {
        operation: createOperation({
          children: [
            {
              type: 'asyncapi-message',
              id: 'doc/channel/userSignedUp/operation/onUserSignedUp/message/userSignedUp',
              title: 'User signed up',
              messageName: 'userSignedUp',
              channelName: 'userSignedUp',
            },
          ],
        }),
        document: {
          asyncapi: '3.0.0',
          info: { title: 'Streaming API', version: '1.0.0' },
          'x-scalar-original-document-hash': '',
          channels: {
            userSignedUp: {
              address: 'user/signedup',
              messages: {
                userSignedUp: { title: 'User signed up', payload: { type: 'object' } },
              },
            },
          },
          operations: {
            onUserSignedUp: { action: 'receive', channel: { $ref: '#/channels/userSignedUp' } },
          },
        } as unknown as AsyncApiDocument,
        eventBus: null,
      },
    })

    // Message renders (collapsed); its title shows in the accordion header.
    expect(wrapper.findComponent({ name: 'Message' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('User signed up')
  })
})
