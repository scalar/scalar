import CodeExamplesBlock from '@/blocks/components/CodeExamplesBlock/CodeExamplesBlock.vue'
import ExampleResponsesBlock from '@/blocks/components/ExampleResponsesBlock/ExampleResponsesBlock.vue'
import OperationDetails from '@/blocks/components/OperationBlock/components/OperationDetails.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationBlock from './OperationBlock.vue'

describe('OperationBlock', () => {
  it('exists', () => {
    expect(OperationBlock).toBeDefined()
  })

  it('renders empty state when no operation found', () => {
    const wrapper = mount(OperationBlock, {
      props: {
        // @ts-expect-error
        store: {},
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('No operation found')
    expect(wrapper.text()).toContain('location: #/paths/get/test')
  })

  it('renders operation details when operation exists', () => {
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

    const wrapper = mount(OperationBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.findComponent(OperationDetails).exists()).toBe(true)
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

    const wrapper = mount(OperationBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.findComponent(CodeExamplesBlock).exists()).toBe(true)
  })

  it('renders example responses when operation exists', () => {
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

    const wrapper = mount(OperationBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.findComponent(ExampleResponsesBlock).exists()).toBe(true)
  })

  it('passes store and location props to child components', () => {
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

    const wrapper = mount(OperationBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    const codeExamples = wrapper.findComponent(CodeExamplesBlock)
    const exampleResponses = wrapper.findComponent(ExampleResponsesBlock)

    expect(codeExamples.props('store')).toEqual(mockStore)
    expect(codeExamples.props('location')).toBe('#/paths/get/test')
    expect(exampleResponses.props('store')).toEqual(mockStore)
    expect(exampleResponses.props('location')).toBe('#/paths/get/test')
  })
})
