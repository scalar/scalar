import type { ClientLayout } from '@/hooks/useLayout'
import { WORKSPACE_SYMBOL } from '@/store/store'
import { mockUseLayout } from '@/vitest.setup'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RequestSection from './RequestSection.vue'

describe('RequestSection', () => {
  const createWrapper = (props = {}, mockStore = {}, layout: ClientLayout = 'desktop') => {
    // Mock the useLayout hook for this specific test
    vi.mocked(mockUseLayout).mockReturnValue({ layout })

    const defaultMockStore = {
      requestMutators: {
        edit: () => {},
      },
      requestExampleMutators: {
        edit: () => {},
      },
      cookies: {},
      securitySchemes: {},
      ...mockStore,
    }

    const defaultProps = {
      collection: {},
      environment: {},
      envVariables: [],
      example: {
        body: {},
        parameters: {
          path: [],
          cookies: [],
          headers: [],
          query: [],
        },
      },
      invalidParams: new Set(),
      operation: {
        uid: '1',
        method: 'post',
        path: '/test',
        summary: 'Test Operation',
      },
      selectedSecuritySchemeUids: [],
      server: undefined,
      workspace: {
        cookies: [],
      },
      ...props,
    }

    return mount(RequestSection, {
      global: {
        provide: {
          [WORKSPACE_SYMBOL]: defaultMockStore,
        },
      },
      props: defaultProps as any,
    })
  }

  it('has required classes', () => {
    const wrapper = createWrapper()

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

  describe('Auth section visibility', () => {
    it('shows Auth section when not in modal layout', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.request-section-content-auth').exists()).toBe(true)

      const filterButtons = wrapper.findAll('button[role="tab"]')
      const authButton = filterButtons.find((button) => button.text() === 'Auth')
      expect(authButton?.exists()).toBe(true)
    })

    it('shows Auth section in modal layout when security schemes exist', () => {
      const wrapper = createWrapper(
        {},
        {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
            },
          },
        },
        'modal',
      )

      expect(wrapper.find('.request-section-content-auth').exists()).toBe(true)

      const filterButtons = wrapper.findAll('button[role="tab"]')
      const authButton = filterButtons.find((button) => button.text() === 'Auth')
      expect(authButton?.exists()).toBe(true)
    })

    it('shows Auth section in modal layout when operation has security', () => {
      const wrapper = createWrapper(
        {
          operation: {
            uid: '1',
            method: 'post',
            path: '/test',
            summary: 'Test Operation',
            security: [{ ApiKeyAuth: [] }],
          },
        },
        {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
            },
          },
        },
        'modal',
      )

      expect(wrapper.find('.request-section-content-auth').exists()).toBe(true)

      const filterButtons = wrapper.findAll('button[role="tab"]')
      const authButton = filterButtons.find((button) => button.text() === 'Auth')
      expect(authButton?.exists()).toBe(true)
    })

    it('hides Auth section in modal layout when no security schemes and no operation security', () => {
      const wrapper = createWrapper(
        {},
        {
          securitySchemes: {},
        },
        'modal',
      )

      expect(wrapper.find('.request-section-content-auth').exists()).toBe(false)

      const filterButtons = wrapper.findAll('button[role="tab"]')
      const authButton = filterButtons.find((button) => button.text() === 'Auth')
      expect(authButton).toBeUndefined()
    })
  })
})
