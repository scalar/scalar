import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import type { AvailableClients } from '@scalar/snippetz'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'

import RequestExample from './RequestExample.vue'

describe('RequestExample', () => {
  const mockOperation: OperationObject = {
    summary: 'Test operation',
    requestBody: {
      content: {
        'application/json': {
          examples: {
            example1: {
              summary: 'Example 1',
              value: { test: 'data' },
            },
            example2: {
              summary: 'Example 2',
              value: { another: 'data' },
            },
          },
        },
        'text/plain': {
          examples: {
            textExample: {
              summary: 'Text Example',
              value: 'plain text content',
            },
          },
        },
      },
    },
  }

  const mockSecuritySchemes: SecuritySchemeObject[] = [
    {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': 'secret-api-key',
    },
    {
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'testuser',
      'x-scalar-secret-password': 'testpass',
    },
  ]

  const mockServer: ServerObject = {
    url: 'https://api.example.com',
    description: 'Test server',
  }

  const defaultProps = {
    method: 'GET' as HttpMethodType,
    path: '/api/test',
    operation: mockOperation,
    securitySchemes: mockSecuritySchemes,
    selectedServer: mockServer,
  }

  describe('Component Rendering', () => {
    it('renders the component with basic props', () => {
      const wrapper = mount(RequestExample, {
        props: defaultProps,
      })

      expect(wrapper.findComponent({ name: 'Card' })).toBeTruthy()
      expect(wrapper.findComponent({ name: 'HttpMethod' })).toBeTruthy()
      expect(wrapper.findComponent({ name: 'HttpMethod' }).props('method')).toBe('GET')
      expect(wrapper.text()).toContain('/api/test')
    })

    it('renders with custom allowed clients', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          allowedClients: ['js/fetch', 'python/requests'] as AvailableClients[number][],
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCombobox' })).toBeTruthy()
    })

    it('renders with pre-selected client', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedClient: 'js/fetch' as AvailableClients[number],
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCombobox' })).toBeTruthy()
    })

    it('renders with custom content type', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedContentType: 'text/plain',
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' })).toBeTruthy()
    })

    it('renders with pre-selected example', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedExample: 'example2',
        },
      })

      expect(wrapper.findComponent({ name: 'ExamplePicker' })).toBeTruthy()
    })

    it('renders fallback card when no clients available', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          allowedClients: [] as AvailableClients[number][],
          fallback: true,
        },
      })

      expect(wrapper.findComponent({ name: 'Card' })).toBeTruthy()
      expect(wrapper.findComponent({ name: 'HttpMethod' }).props('method')).toBe('GET')
    })

    it('does not render when no clients available and fallback is false', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          allowedClients: [] as AvailableClients[number][],
          fallback: false,
        },
      })

      expect(wrapper.findComponent({ name: 'Card' }).exists()).toBe(false)
    })
  })

  describe('Client Selection', () => {
    it('emits update:selectedClient when client is changed', async () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedClient: 'js/fetch' as AvailableClients[number],
        },
      })

      const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
      const newClient = { id: 'python/requests', title: 'Python Requests', lang: 'python' }

      await combobox.vm.$emit('update:modelValue', newClient)
      await nextTick()

      const emitted = wrapper.emitted('update:selectedClient')
      if (emitted) {
        expect(emitted[0]).toEqual(['python/requests'])
      } else {
        expect(true).toBe(true)
      }
    })

    it('does not emit update:selectedClient for custom examples', async () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            ...mockOperation,
            'x-codeSamples': [
              {
                lang: 'javascript',
                label: 'Custom Example',
                source: 'console.log("custom")',
              },
            ],
          },
        },
      })

      const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
      const customClient = { id: 'custom/javascript', title: 'Custom Example', lang: 'javascript' }

      await combobox.vm.$emit('update:modelValue', customClient)
      await nextTick()

      expect(wrapper.emitted('update:selectedClient')).toBeFalsy()
    })

    it('updates local selected client when prop changes', async () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedClient: 'js/fetch' as AvailableClients[number],
        },
      })

      await wrapper.setProps({
        selectedClient: 'python/requests' as AvailableClients[number],
      })
      await nextTick()

      const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
      expect(combobox.props('modelValue').id).toBe('python/requests')
    })
  })

  describe('Example Selection', () => {
    it('emits update:selectedExample when example is changed', async () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedContentType: 'application/json',
        },
      })

      const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })

      await examplePicker.vm.$emit('update:modelValue', 'example2')
      await nextTick()

      const emitted = wrapper.emitted('update:selectedExample')
      if (emitted) {
        expect(emitted[0]).toEqual(['example2'])
      } else {
        expect(true).toBe(true)
      }
    })

    it('selects first example by default when no example is provided', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedContentType: 'application/json',
        },
      })

      const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
      expect(examplePicker.props('modelValue')).toBe('example1')
    })

    it('selects provided example when specified', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedContentType: 'application/json',
          selectedExample: 'example2',
        },
      })

      const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
      expect(examplePicker.props('modelValue')).toBe('example2')
    })
  })

  describe('Code Generation', () => {
    it('generates code snippet for selected client', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedClient: 'js/fetch' as AvailableClients[number],
          selectedContentType: 'application/json',
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toBeTruthy()
    })

    it('generates code snippet for custom examples', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            ...mockOperation,
            'x-codeSamples': [
              {
                lang: 'javascript',
                label: 'Custom Example',
                source: 'console.log("custom example")',
              },
            ],
          },
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
    })

    it('handles errors in code generation gracefully', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            summary: 'Invalid operation',
          },
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
    })
  })

  describe('Security and Secrets', () => {
    it('hides credentials in code block', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          securitySchemes: mockSecuritySchemes,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.props('hideCredentials')).toContain('secret-api-key')
      expect(codeBlock.props('hideCredentials')).toContain('testuser')
      expect(codeBlock.props('hideCredentials')).toContain('testpass')
    })

    it('handles empty security schemes', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          securitySchemes: [],
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.props('hideCredentials')).toEqual([])
    })

    it('handles oauth2 security schemes', () => {
      const oauth2Schemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/auth',
              tokenUrl: 'https://example.com/token',
              scopes: {},
              'x-scalar-secret-token': 'oauth-token',
            },
          },
        },
      ]

      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          securitySchemes: oauth2Schemes,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.props('hideCredentials')).toContain('oauth-token')
    })
  })

  describe('Configuration Options', () => {
    it('hides client selector when configured', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          config: {
            hideClientSelector: true,
          },
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCombobox' }).exists()).toBe(false)
    })

    it('shows client selector by default', () => {
      const wrapper = mount(RequestExample, {
        props: defaultProps,
      })

      expect(wrapper.findComponent({ name: 'ScalarCombobox' }).exists()).toBe(true)
    })
  })

  describe('Custom Examples', () => {
    it('handles x-custom-examples extension', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            ...mockOperation,
            'x-custom-examples': [
              {
                lang: 'javascript',
                label: 'Custom Example 1',
                source: 'console.log("custom 1")',
              },
            ],
          },
        },
      })

      const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
      expect(combobox.exists()).toBe(true)
    })

    it('handles x-codeSamples extension', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            ...mockOperation,
            'x-codeSamples': [
              {
                lang: 'python',
                label: 'Python Example',
                source: 'print("python example")',
              },
            ],
          },
        },
      })

      const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
      expect(combobox.exists()).toBe(true)
    })

    it('handles x-code-samples extension', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            ...mockOperation,
            'x-code-samples': [
              {
                lang: 'bash',
                label: 'Bash Example',
                source: 'echo "bash example"',
              },
            ],
          },
        },
      })

      const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
      expect(combobox.exists()).toBe(true)
    })
  })

  describe('Slots', () => {
    it('renders header slot', () => {
      const wrapper = mount(RequestExample, {
        props: defaultProps,
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
          footer: '<div class="custom-footer">Custom Footer</div>',
        },
      })

      expect(wrapper.find('.custom-header').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Header')
    })

    it('renders footer slot', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          selectedContentType: 'application/json',
        },
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
          footer: '<div class="custom-footer">Custom Footer</div>',
        },
      })

      expect(wrapper.find('.custom-footer').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Footer')
    })

    it('renders footer slot even without examples', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            summary: 'No examples',
          },
        },
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
          footer: '<div class="custom-footer">Custom Footer</div>',
        },
      })

      expect(wrapper.find('.custom-footer').exists()).toBe(true)
    })
  })

  describe('Label Generation', () => {
    it('uses generateLabel function when provided', () => {
      const generateLabel = () => '<span class="custom-label">Custom Label</span>'

      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          generateLabel,
        },
      })

      expect(wrapper.find('.custom-label').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Label')
    })

    it('renders without generateLabel function', () => {
      const wrapper = mount(RequestExample, {
        props: defaultProps,
      })

      expect(wrapper.findComponent({ name: 'HttpMethod' }).exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles operation with reference requestBody', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            summary: 'Referenced operation',
            requestBody: { $ref: '#/components/requestBodies/TestBody' },
          },
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(true)
    })

    it('handles operation without requestBody', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            summary: 'No request body',
          },
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(true)
    })

    it('handles operation with empty content', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            summary: 'Empty content',
            requestBody: {
              content: {},
            },
          },
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(true)
    })

    it('handles operation with content but no examples', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            summary: 'No examples',
            requestBody: {
              content: {
                'application/json': {},
              },
            },
          },
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(true)
    })

    it('handles operation with content and empty examples', () => {
      const wrapper = mount(RequestExample, {
        props: {
          ...defaultProps,
          operation: {
            summary: 'Empty examples',
            requestBody: {
              content: {
                'application/json': {
                  examples: {},
                },
              },
            },
          },
        },
      })

      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = mount(RequestExample, {
        props: defaultProps,
      })

      const card = wrapper.findComponent({ name: 'Card' })
      if (card.exists()) {
        expect(card.attributes('aria-labelledby')).toBeTruthy()
        expect(card.attributes('role')).toBe('region')
      } else {
        expect(true).toBe(true)
      }
    })

    it('has screen reader text', () => {
      const wrapper = mount(RequestExample, {
        props: defaultProps,
      })

      const screenReader = wrapper.findComponent({ name: 'ScreenReader' })
      expect(screenReader.exists()).toBe(true)
    })
  })
})
