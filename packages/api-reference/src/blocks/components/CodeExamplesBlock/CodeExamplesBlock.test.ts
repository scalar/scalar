import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CodeExamplesBlock from './CodeExamplesBlock.vue'

describe('CodeExamplesBlock', () => {
  it('exists', () => {
    expect(CodeExamplesBlock).toBeDefined()
  })

  it('renders empty state when no operation found', () => {
    const wrapper = mount(CodeExamplesBlock, {
      props: {
        // @ts-expect-error
        store: {},
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('No operation found')
    expect(wrapper.text()).toContain('location: #/paths/get/test')
    expect(wrapper.text()).toContain('store: {}')
  })

  it('renders code examples when operation exists', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req1'],
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'get',
          path: 'test',
        },
      },
    }

    const wrapper = mount(CodeExamplesBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('Code Examples')
    expect(wrapper.text()).toContain('get')
    expect(wrapper.text()).toContain('test')
  })

  it('handles operation with different path/method than location', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req1'],
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'post', // Different method
          path: 'other', // Different path
        },
      },
    }

    const wrapper = mount(CodeExamplesBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('No operation found')
  })

  it('handles store with no collections', () => {
    const wrapper = mount(CodeExamplesBlock, {
      props: {
        // @ts-expect-error
        store: { requests: {} },
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('No operation found')
  })

  it('handles store with no requests', () => {
    const wrapper = mount(CodeExamplesBlock, {
      props: {
        // @ts-expect-error
        store: { collections: {} },
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('No operation found')
  })
})
