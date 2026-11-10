import { AsyncApiCodeExample, ExamplePicker } from '@scalar/blocks/code-example'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import type { TraversedAsyncApiOperation } from '@scalar/workspace-store/schemas/navigation'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { PLUGIN_MANAGER_SYMBOL, createPluginManager } from '@/plugins'

import MessageExamples from './MessageExamples.vue'
import Operation from './Operation.vue'
import OperationMessageExamples from './OperationMessageExamples.vue'
import OperationReply from './OperationReply.vue'

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

vi.unmock('@/plugins/hooks/usePluginManager')

describe('Operation', () => {
  it('renders plugin-only extensions without default selection', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          'x-owner': 'team',
        }),
        eventBus: null,
      },
      global: {
        provide: {
          [PLUGIN_MANAGER_SYMBOL]: createPluginManager({
            plugins: [
              () => ({
                name: 'owner',
                extensions: [{ name: 'x-owner', component: { render: () => 'Custom owner' } }],
              }),
            ],
          }),
        },
      },
    })
    expect(wrapper.text()).toContain('Custom owner')
    expect(wrapper.text()).not.toContain('x-owner:')
  })

  it('renders referenced trait extensions with overrides and null deletion', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        eventBus: null,
        options: { showExtensions: ['x-array', 'x-own', 'x-null', 'x-removed', 'x-literal'] },
        document: createDocument({
          $ref: '#/components/example',
          'x-own': 'ignored sibling',
          '$ref-value': {
            action: 'receive',
            channel: { $ref: '#/channels/userSignedUp' },
            traits: [
              {
                $ref: '#/components/traits/common',
                '$ref-value': {
                  'x-array': [false, 0, null],
                  'x-own': 'inherited',
                  'x-removed': 'remove me',
                  'x-literal': { $ref: 'literal-data' },
                },
              },
            ],
            'x-own': 'local-value',
            'x-null': null,
            'x-removed': null,
          },
        }),
      },
    })
    expect(wrapper.text()).toContain('local-value')
    expect(wrapper.text()).toContain('literal-data')
    expect(wrapper.text()).toContain('x-null:null')
    expect(wrapper.text()).toContain('false')
    expect(wrapper.text()).not.toContain('ignored sibling')
    expect(wrapper.text()).not.toContain('inherited')
    expect(wrapper.text()).not.toContain('x-removed')
  })

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
        const hiddenSummary = value === summary && Boolean(description?.trim()) && heading !== summary?.trim()
        expect(wrapper.text().split(value.trim()).length - 1).toBe(hiddenSummary ? 0 : 1)
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
      expect(wrapper.text().split(`${source} ${field}`).length - 1).toBe(field === 'summary' ? 0 : 1)
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

  it('selects message payloads in the code example without a duplicate payload card', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        servers: { production: { host: 'example.com', protocol: 'wss' } },
        channels: {
          userSignedUp: {
            address: '/events',
            messages: {
              first: { title: 'First', examples: [{ payload: 'first payload' }] },
              'second/event': { title: 'Second', examples: [{ payload: 'second payload' }] },
            },
          },
        },
        operations: {
          onUserSignedUp: {
            action: 'receive',
            channel: { $ref: '#/channels/userSignedUp' },
            messages: [
              { $ref: '#/channels/userSignedUp/messages/first' },
              { $ref: '#/channels/userSignedUp/messages/second~1event' },
            ],
          },
        },
      },
    })
    const document = store.workspace.activeDocument
    if (!isAsyncApiDocument(document)) {
      throw new Error('Expected AsyncAPI')
    }
    const children = ['first', 'second/event'].map((messageName) => ({
      type: 'asyncapi-message' as const,
      id: `nav/${messageName}`,
      title: messageName,
      messageName,
      channelName: 'userSignedUp',
    }))
    const wrapper = mount(Operation, { props: { document, operation: createOperation({ children }), eventBus: null } })
    const code = wrapper.getComponent(AsyncApiCodeExample)
    expect(wrapper.findComponent(OperationMessageExamples).exists()).toBe(false)
    expect(code.text()).toContain('first payload')
    code.getComponent(ExamplePicker).vm.$emit('update:modelValue', 'second/event')
    await nextTick()
    expect(code.text()).toContain('second payload')
    expect(code.text()).not.toContain('first payload')
  })

  it('selects reply examples independently and keeps only schemas in the reply section', async () => {
    const document = createDocument({
      action: 'send',
      channel: { $ref: '#/channels/userSignedUp' },
      reply: {
        channel: { $ref: '#/channels/userSignedUp' },
        messages: [
          { $ref: '#/channels/userSignedUp/messages/accepted' },
          { $ref: '#/channels/userSignedUp/messages/rejected' },
        ],
      },
    })
    document.channels = {
      userSignedUp: {
        address: '/events',
        messages: {
          request: { title: 'Request', examples: [{ payload: 'request payload' }] },
          accepted: { title: 'Accepted', payload: { type: 'string' }, examples: [{ payload: 'accepted payload' }] },
          rejected: { title: 'Rejected', payload: { type: 'string' }, examples: [{ payload: 'rejected payload' }] },
        },
      },
    }
    document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)
    const wrapper = mount(Operation, {
      props: {
        document,
        eventBus: null,
        operation: createOperation({
          children: [
            {
              type: 'asyncapi-message',
              id: 'request',
              title: 'Request',
              channelName: 'userSignedUp',
              messageName: 'request',
            },
          ],
        }),
      },
    })
    const panels = wrapper.findAllComponents(OperationMessageExamples)
    expect(panels).toHaveLength(1)
    const [reply] = panels
    expect(reply!.get('pre').text()).toContain('accepted payload')
    reply!.getComponent(ExamplePicker).vm.$emit('update:modelValue', 'rejected')
    await nextTick()
    expect(reply!.get('pre').text()).toContain('rejected payload')
    const schemas = wrapper.getComponent(OperationReply)
    await schemas.get('button.collapsible-section-toggle').trigger('click')
    expect(schemas.text()).toContain('Payload')
    expect(schemas.findComponent(MessageExamples).exists()).toBe(false)
  })

  it.each([
    { operationMessages: ['request'], expectedMessages: ['request'], inlineReplies: [false, false] },
    { operationMessages: ['request', 'result'], expectedMessages: ['request', 'result'], inlineReplies: [true, false] },
  ])(
    'lists reply messages on the same channel under Replies: $operationMessages',
    ({ operationMessages, expectedMessages, inlineReplies }) => {
      const document = createDocument({
        action: 'receive',
        channel: { $ref: '#/channels/userSignedUp' },
        messages: operationMessages.map((name) => ({ $ref: `#/channels/userSignedUp/messages/${name}` })),
        reply: {
          channel: { $ref: '#/channels/userSignedUp' },
          messages: [
            { $ref: '#/channels/userSignedUp/messages/result' },
            { $ref: '#/channels/userSignedUp/messages/failure' },
          ],
        },
      })
      document.channels = {
        userSignedUp: {
          address: '/ws',
          messages: {
            request: { title: 'Request' },
            result: { title: 'Result' },
            failure: { title: 'Failure' },
          },
        },
      }
      const navigation = traverseAsyncApiDocument('test', document)
      document['x-scalar-navigation'] = navigation
      const channel = navigation.children?.find((entry) => entry.type === 'asyncapi-channel')
      const operation = channel?.children?.find((entry) => entry.type === 'asyncapi-operation')
      const wrapper = mount(Operation, {
        props: { document, eventBus: null, operation: operation as TraversedAsyncApiOperation },
      })
      const replies = wrapper.getComponent(OperationReply).findAllComponents({ name: 'Message' })

      expect(
        wrapper
          .findAllComponents({ name: 'Message' })
          .filter((message) => !replies.some((reply) => reply.element === message.element))
          .map((message) => message.props('message').messageName),
      ).toStrictEqual(expectedMessages)
      expect(replies.map((message) => message.props('message').messageName)).toStrictEqual(['result', 'failure'])
      expect(replies.map((message) => message.props('inline'))).toStrictEqual(inlineReplies)
    },
  )

  it('reveals a nested reply property when navigation opens the message', async () => {
    const document = createDocument({
      action: 'receive',
      channel: { $ref: '#/channels/userSignedUp' },
      messages: [],
      reply: {
        channel: { $ref: '#/channels/userSignedUp' },
        messages: [{ $ref: '#/channels/userSignedUp/messages/result' }],
      },
    })
    document.channels = {
      userSignedUp: {
        address: '/ws',
        messages: {
          result: {
            title: 'Result',
            correlationId: { location: '$message.payload#/metadata/trace/id' },
            payload: {
              type: 'object',
              properties: {
                metadata: {
                  type: 'object',
                  properties: {
                    trace: { type: 'object', properties: { id: { type: 'string' } } },
                  },
                },
              },
            },
          },
        },
      },
    }
    const navigation = traverseAsyncApiDocument('test', document)
    document['x-scalar-navigation'] = navigation
    const channel = navigation.children?.find((entry) => entry.type === 'asyncapi-channel')
    const operation = channel?.children?.find((entry) => entry.type === 'asyncapi-operation')
    if (!operation?.children?.[0]) {
      throw new Error('Expected an operation with a reply message')
    }
    const messageId = operation.children[0].id
    const targetId = `${messageId}.payload.metadata.trace.id`
    const wrapper = mount(Operation, {
      props: { document, operation, eventBus: createWorkspaceEventBus(), expandedItems: {} },
    })

    expect(wrapper.find(`[id="${targetId}"]`).exists()).toBe(false)
    await wrapper.setProps({ expandedItems: { [messageId]: true }, scrollTargetId: targetId })
    await vi.waitFor(() => expect(wrapper.get(`[id="${targetId}"]`).text()).toBe('id'))
    expect(wrapper.get(`[id="${targetId}"]`).attributes('tabindex')).toBe('-1')
    await wrapper.setProps({ expandedItems: { [messageId]: false } })
    expect(wrapper.find(`[id="${targetId}"]`).exists()).toBe(false)
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

  it('supports default, custom, and empty actions', () => {
    const props = { operation: createOperation(), document: createDocument({ action: 'receive' }), eventBus: null }
    expect(mount(Operation, { props }).text()).toContain('Copy as Markdown')
    const custom = mount(Operation, { props, slots: { actions: '<button>Custom action</button>' } })
    expect(custom.text()).toContain('Custom action')
    expect(custom.text()).not.toContain('Copy as Markdown')
    expect(mount(Operation, { props, slots: { actions: () => [] } }).text()).not.toContain('Copy as Markdown')
  })
})
