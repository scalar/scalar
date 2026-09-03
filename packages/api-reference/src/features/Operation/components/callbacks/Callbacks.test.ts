import type { CallbackObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import {
  SCHEMA_EXPANSION_SYMBOL,
  createSchemaExpansionStore,
} from '@/components/Content/Schema/helpers/schema-expansion'

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
          hideModels: false,
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
          expandAllSchemaProperties: false,
          schemaLayout: 'legacy' as const,
          schemaKeyboardNav: false,
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

  describe('tree layout', () => {
    /** One callback name over two urls, one of them with two methods. */
    const oneNameManyRows = {
      onData: {
        '{$request.query.callbackUrl}/primary': {
          post: { responses: { '200': { description: 'Primary' } } },
          get: { responses: { '200': { description: 'Primary status' } } },
        },
        '{$request.query.callbackUrl}/backup': {
          post: { responses: { '200': { description: 'Backup' } } },
        },
      },
    } as CallbackObject

    const mountCallbacks = (schemaLayout: 'legacy' | 'tree') =>
      mount(Callbacks, {
        props: {
          path: '/subscribe',
          breadcrumb: ['op'],
          callbacks: oneNameManyRows,
          eventBus: null,
          options: {
            hideModels: false,
            orderRequiredPropertiesFirst: false,
            orderSchemaPropertiesBy: 'alpha' as const,
            expandAllSchemaProperties: false,
            schemaLayout,
            schemaKeyboardNav: false,
          },
        },
        global: {
          // `<ApiReference>` owns one store for the whole page, so two rows that
          // key alike really do share state. Left to their own fallbacks they
          // never would, and the collision below would be invisible.
          provide: { [SCHEMA_EXPANSION_SYMBOL as symbol]: createSchemaExpansionStore() },
        },
      })

    it('keeps the native details element in the legacy layout', () => {
      const wrapper = mountCallbacks('legacy')

      expect(wrapper.findAll('details').length).toBe(3)
      expect(wrapper.find('.callback-item-trigger').exists()).toBe(false)
    })

    it('renders each callback as a disclosure row', () => {
      const wrapper = mountCallbacks('tree')

      expect(wrapper.findAll('details').length).toBe(0)
      expect(wrapper.findAll('.callback-item-trigger').length).toBe(3)
    })

    it('gives every callback of one name its own expansion state', async () => {
      const wrapper = mountCallbacks('tree')

      const triggers = wrapper.findAll('.callback-item-trigger')
      await triggers[0]!.trigger('click')

      // A callback's identity is name AND url AND method: one name can carry
      // several urls, and one url several methods. Drop either and opening one
      // row opens its twin.
      expect(triggers.map((trigger) => trigger.attributes('aria-expanded'))).toEqual(['true', 'false', 'false'])
    })
  })
})
