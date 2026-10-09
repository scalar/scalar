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
    expect(wrapper.find('.operation-action').text()).toBe('receive')
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

    expect(wrapper.find('.operation-action').text()).toBe('send')
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
