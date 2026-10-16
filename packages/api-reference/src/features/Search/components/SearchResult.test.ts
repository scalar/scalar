import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { FuseData } from '@/features/Search/types'

import SearchResult from './SearchResult.vue'

describe('SearchResult', () => {
  it.each(['asyncapi-channel', 'asyncapi-operation', 'asyncapi-message'] as const)(
    'labels unknown and known addresses for %s results',
    async (type) => {
      const entry =
        type === 'asyncapi-channel'
          ? { type, id: 'events', title: 'Events', channelName: 'events', channelAddress: 'events' }
          : type === 'asyncapi-operation'
            ? {
                type,
                id: 'events',
                title: 'Events',
                operationName: 'sendEvents',
                channelName: 'events',
                channelAddress: 'events',
                action: 'send' as const,
              }
            : { type, id: 'events', title: 'Events', channelName: 'events', messageName: 'event' }
      const item: FuseData = { type, id: 'events', title: 'Events', description: '', entry }
      const wrapper = mount(SearchResult, { props: { id: 'events', isSelected: false, result: { refIndex: 0, item } } })
      expect(wrapper.text()).toContain('Address: Unknown')
      await wrapper.setProps({ result: { refIndex: 0, item: { ...item, path: 'Events' } } })
      expect(wrapper.text()).toContain('Address: Events')
      expect(wrapper.text()).not.toContain('Unknown')
      await wrapper.setProps({ result: { refIndex: 0, item: { ...item, path: '' } } })
      expect(wrapper.text()).not.toContain('Unknown')
      wrapper.unmount()
    },
  )

  it('keeps HTTP method and path metadata for OpenAPI results', () => {
    const wrapper = mount(SearchResult, {
      props: {
        id: 'users',
        isSelected: false,
        result: {
          refIndex: 0,
          item: {
            id: 'users',
            type: 'operation',
            title: 'List users',
            description: '',
            method: 'get',
            path: '/users',
            entry: {
              id: 'users',
              type: 'operation',
              title: 'List users',
              method: 'get',
              path: '/users',
              ref: '#/paths/~1users/get',
            },
          },
        },
      },
    })
    expect(wrapper.text()).toContain('/users')
    expect(wrapper.text()).not.toContain('Unknown')
    expect(wrapper.text()).not.toContain('Address:')
    wrapper.unmount()
  })

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
