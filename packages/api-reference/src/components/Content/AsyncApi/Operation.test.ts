import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiOperation } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

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

describe('Operation', () => {
  it('renders the operation title and the action badge', () => {
    const wrapper = mount(Operation, {
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

  it('renders a message accordion for each message child', () => {
    const wrapper = mount(Operation, {
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

  it('renders operation bindings', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          bindings: { kafka: { groupId: 'my-group', clientId: 'my-client' } },
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Bindings')
    expect(wrapper.text()).toContain('kafka')
    expect(wrapper.text()).toContain('groupId')
  })

  it('renders an operation security badge', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document: {
          asyncapi: '3.0.0',
          info: { title: 'Streaming API', version: '1.0.0' },
          'x-scalar-original-document-hash': '',
          channels: { userSignedUp: { address: 'user/signedup' } },
          operations: {
            onUserSignedUp: {
              action: 'receive',
              channel: { $ref: '#/channels/userSignedUp' },
              security: [{ $ref: '#/components/securitySchemes/apiKey' }],
            },
          },
          components: {
            securitySchemes: { apiKey: { type: 'httpApiKey', name: 'X-Api-Key', in: 'header' } },
          },
        } as unknown as AsyncApiDocument,
        eventBus: null,
      },
    })

    expect(wrapper.findComponent({ name: 'SecurityRequirementBadge' }).exists()).toBe(true)
  })

  it('renders the operation reply', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          reply: { address: { location: '$message.header#/replyTo' } },
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Reply')
    expect(wrapper.text()).toContain('$message.header#/replyTo')
  })

  it('renders operation tags', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document: createDocument({
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          tags: [{ name: 'users' }],
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('users')
  })
})
