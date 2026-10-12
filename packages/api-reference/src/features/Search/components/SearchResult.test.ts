import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SearchResult from './SearchResult.vue'

describe('SearchResult', () => {
  it.each(['send', 'receive'] as const)('shows %s when the operation title equals the channel address', (action) => {
    const wrapper = mount(SearchResult, {
      props: {
        id: 'events',
        isSelected: false,
        result: {
          refIndex: 0,
          item: {
            id: 'events',
            type: 'asyncapi-operation',
            title: 'events',
            description: '',
            path: 'events',
            action,
            entry: {
              id: 'events',
              type: 'asyncapi-operation',
              title: 'events',
              operationName: 'publish',
              channelName: 'events',
              channelAddress: 'events',
              action,
            },
          },
        },
      },
    })
    expect(wrapper.text()).toContain(action)
    wrapper.unmount()
  })
})
