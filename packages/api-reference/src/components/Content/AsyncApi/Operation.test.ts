import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiOperation } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Operation from './Operation.vue'

function createOperation(overrides: Partial<TraversedAsyncApiOperation> = {}): TraversedAsyncApiOperation {
  return {
    type: 'asyncapi-operation',
    id: 'doc/channel/userSignedUp/operation/onUserSignedUp',
    title: 'On user signed up',
    operationName: 'onUserSignedUp',
    action: 'receive',
    channelName: 'userSignedUp',
    channelAddress: 'user/signedup',
    children: [
      {
        type: 'asyncapi-message',
        id: 'doc/channel/userSignedUp/message/userSignedUp',
        title: 'User signed up',
        messageName: 'userSignedUp',
        channelName: 'userSignedUp',
      },
    ],
    ...overrides,
  }
}

const document = {
  asyncapi: '3.0.0',
  info: { title: 'Streaming API', version: '1.0.0' },
  'x-scalar-original-document-hash': '',
  channels: {
    userSignedUp: {
      address: 'user/signedup',
      messages: { userSignedUp: { title: 'User signed up' } },
    },
  },
} as unknown as AsyncApiDocument

describe('Operation', () => {
  it('renders the operation title and its action', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document,
        eventBus: null,
        expandedItems: {},
      },
    })

    expect(wrapper.find('h3').text()).toContain('On user signed up')
    expect(wrapper.text()).toContain('receive')
  })

  it('lists its messages as accordions', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation(),
        document,
        eventBus: null,
        expandedItems: {},
      },
    })

    expect(wrapper.findComponent({ name: 'Message' }).exists()).toBe(true)
  })

  it('renders no message accordions when the operation has none', () => {
    const wrapper = mount(Operation, {
      props: {
        operation: createOperation({ children: undefined }),
        document,
        eventBus: null,
        expandedItems: {},
      },
    })

    expect(wrapper.findComponent({ name: 'Message' }).exists()).toBe(false)
  })
})
