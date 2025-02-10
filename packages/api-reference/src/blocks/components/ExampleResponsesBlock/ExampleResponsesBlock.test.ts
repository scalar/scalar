import { createStore } from '@/blocks/lib/createStore'
import { getPointer } from '@/blocks/utils/getPointer'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExampleResponsesBlock from './ExampleResponsesBlock.vue'

describe('ExampleResponsesBlock', () => {
  it('mounts the component', async () => {
    const { store } = createStore({
      content: JSON.stringify({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      examples: {
                        default: {
                          value: { foo: 'bar' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    })

    const wrapper = mount(ExampleResponsesBlock, {
      props: {
        store,
        location: getPointer(['paths', '/test', 'get']),
      },
    })

    expect(wrapper.exists()).toBe(true)

    // Wait for the store to be ready
    await new Promise((resolve) => setTimeout(resolve, 20))

    // Check if ExampleResponses component is rendered
    expect(wrapper.findComponent({ name: 'ExampleResponses' }).exists()).toBe(
      true,
    )

    // Verify the responses prop is passed correctly
    const exampleResponses = wrapper.findComponent({ name: 'ExampleResponses' })
    expect(exampleResponses.props('responses')).toEqual({
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            examples: {
              default: {
                value: { foo: 'bar' },
              },
            },
          },
        },
      },
    })
  })
})
