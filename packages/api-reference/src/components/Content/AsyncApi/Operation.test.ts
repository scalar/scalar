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

  it('renders the required OAuth scopes below the description', () => {
    const wrapper = mount(Operation, {
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

    expect(wrapper.text()).toContain('OAuth scopes')
    expect(wrapper.text()).toContain('read:events')
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
})
