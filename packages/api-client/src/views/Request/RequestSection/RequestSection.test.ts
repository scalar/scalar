import { WORKSPACE_SYMBOL } from '@/store/store'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RequestSection from './RequestSection.vue'

describe('RequestSection', () => {
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
    }

    const wrapper = mount(RequestSection, {
      global: {
        provide: {
          [WORKSPACE_SYMBOL]: mockWorkspaceStore,
        },
      },
      props: {
        // @ts-expect-error
        collection: {},
        // @ts-expect-error
        environment: {},
        envVariables: [],
        example: {
          // @ts-expect-error
          body: {},
          parameters: {
            path: [],
            cookies: [],
            headers: [],
            query: [],
          },
        },
        // @ts-expect-error
        invalidParams: new Set(),
        operation: {
          // @ts-expect-error
          uid: '1',
          method: 'post',
          path: '/test',
          summary: 'Test Operation',
        },
        selectedSecuritySchemeUids: [],
        server: undefined,
        // @ts-expect-error
        workspace: {
          cookies: [],
        },
      },
    })

    const requiredClasses = [
      'request-section-content-auth',
      'request-section-content-path-params',
      'request-section-content-cookies',
      'request-section-content-headers',
      'request-section-content-query',
      'request-section-content-body',
      'request-section-content-code-example',
    ]

    requiredClasses.forEach((className) => {
      expect(wrapper.find(`.${className}`).exists()).toBe(true)
    })
  })
})
