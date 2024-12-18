import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExampleResponsesBlock from './ExampleResponsesBlock.vue'

describe('ExampleResponsesBlock', () => {
  it('exists', () => {
    expect(ExampleResponsesBlock).toBeDefined()
  })

  it('renders empty state when no operation found', () => {
    const wrapper = mount(ExampleResponsesBlock, {
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
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  example: { foo: 'bar' },
                },
              },
            },
          },
        },
      },
    }

    const wrapper = mount(ExampleResponsesBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('Example Responses')
    expect(wrapper.text()).toContain('200')
    expect(wrapper.text()).toContain('OK')
  })

  it('handles operation with no responses', () => {
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
          responses: {},
        },
      },
    }

    const wrapper = mount(ExampleResponsesBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('Example Responses')
    expect(wrapper.text()).toContain('{}')
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
          responses: {
            '200': {
              description: 'OK',
            },
          },
        },
      },
    }

    const wrapper = mount(ExampleResponsesBlock, {
      props: {
        // @ts-expect-error
        store: mockStore,
        location: '#/paths/get/test',
      },
    })

    expect(wrapper.text()).toContain('No operation found')
  })
})
