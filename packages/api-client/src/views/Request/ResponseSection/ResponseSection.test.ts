import { WORKSPACE_SYMBOL } from '@/store/store'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ResponseSection from './ResponseSection.vue'

describe('ResponseSection', () => {
  it('has required classes', () => {
    // TODO: Wow, there must be a better way to test this component, but we might need to refactor the component to get rid of the mocking.

    // Mock the workspace store
    const mockWorkspaceStore = {
      requestMutators: {
        edit: () => {},
      },
      requestExampleMutators: {
        edit: () => {},
      },
      cookies: {},
      securitySchemes: {},
      events: {
        requestStatus: {
          on: () => {},
          off: () => {},
          emit: () => {},
        },
      },
    }

    const wrapper = mount(ResponseSection, {
      global: {
        provide: {
          [WORKSPACE_SYMBOL]: mockWorkspaceStore,
        },
      },
      props: {
        numWorkspaceRequests: 0,
        response: {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json',
          },
          // @ts-expect-error body should be ReadableStream but we don't need it for this test
          body: {},
          data: '',
          cookies: [],
          size: 0,
          time: 1000,
          duration: 1000,
          cookieHeaderKeys: [],
        },
      },
    })

    const requiredClasses = [
      'response-section-content',
      'response-section-content-cookies',
      'response-section-content-headers',
      'response-section-content-body',
    ]

    requiredClasses.forEach((className) => {
      expect(wrapper.find(`.${className}`).exists()).toBe(true)
    })
  })
})
