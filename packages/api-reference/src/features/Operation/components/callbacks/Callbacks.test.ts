import type { CallbackObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Callbacks from './Callbacks.vue'

describe('Callbacks', () => {
  it('flattens nested callback structure into individual callback items', () => {
    const mockCallbacks = {
      onData: {
        '{$request.query.callbackUrl}/data': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Callback successfully processed',
              },
            },
          },
        },
      },
      onError: {
        '{$request.query.callbackUrl}/error': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Error callback processed',
              },
            },
          },
          get: {
            responses: {
              '200': {
                description: 'Get error status',
              },
            },
          },
        },
      },
    } as CallbackObject

    const wrapper = mount(Callbacks, {
      props: {
        path: '/subscribe',
        callbacks: mockCallbacks,
        eventBus: null,
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
        },
      },
    })

    // Should render the callbacks title
    expect(wrapper.text()).toContain('Callbacks')

    // Should render 3 Callback components (onData POST, onError POST, onError GET)
    const callbackComponents = wrapper.findAllComponents({ name: 'Callback' })
    expect(callbackComponents).toHaveLength(3)

    // Verify the first callback (onData POST)
    expect(callbackComponents[0]?.props()).toMatchObject({
      name: 'onData',
      url: '{$request.query.callbackUrl}/data',
      method: 'post',
    })

    // Verify the second callback (onError POST)
    expect(callbackComponents[1]?.props()).toMatchObject({
      name: 'onError',
      url: '{$request.query.callbackUrl}/error',
      method: 'post',
    })

    // Verify the third callback (onError GET)
    expect(callbackComponents[2]?.props()).toMatchObject({
      name: 'onError',
      url: '{$request.query.callbackUrl}/error',
      method: 'get',
    })
  })
})
