import { createStore } from '@/blocks/lib/createStore'
import { getLocation } from '@/blocks/utils/getLocation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { CodeExamplesBlock } from './index'

describe('CodeExamplesBlock', () => {
  it('renders correctly with the given API definition', async () => {
    const apiDefinition = {
      openapi: '3.0.0',
      info: {
        title: 'Example API',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://api.example.com',
        },
      ],
      paths: {
        '/foobar': {
          get: {
            summary: 'Get example data',
            description: 'Returns example data',
            deprecated: false,
            operationId: 'getExample',
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const { store } = createStore({
      content: JSON.stringify(apiDefinition),
    })

    const wrapper = mount(CodeExamplesBlock, {
      props: {
        store,
        location: getLocation(['paths', '/foobar', 'get']),
      },
    })

    // Wait for the store to be ready
    await new Promise((resolve) => setTimeout(resolve, 20))

    // header
    const requestHeader = wrapper.find('.request-header')
    expect(requestHeader.exists()).toBe(true)
    expect(requestHeader.text()).toBe('GET/foobar')

    // code
    const codeblockPre = wrapper.find('.scalar-codeblock-pre')
    expect(codeblockPre.exists()).toBe(true)
    expect(codeblockPre.text()).toBe('curl https://api.example.com/foobar')
  })
})
