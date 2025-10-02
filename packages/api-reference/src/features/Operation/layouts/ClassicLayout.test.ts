import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ClassicLayout from './ClassicLayout.vue'

describe('ClassicLayout', () => {
  const mockOperation = {
    summary: 'Test Operation',
    operationId: 'test-operation',
    parameters: [],
    responses: {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        'application/xml': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
            },
          },
        },
      },
      required: true,
    },
  }

  const mockConfig = {
    isLoading: false,
    showOperationId: true,
    hideTestRequestButton: false,
  }

  const mockStore = {
    workspace: {
      'x-scalar-default-client': 'curl',
    },
  }

  const defaultProps = {
    id: 'test-operation',
    path: '/test',
    clientOptions: [
      {
        group: 'HTTP',
        options: [
          {
            id: 'curl',
            label: 'cURL',
            language: 'bash',
          },
        ],
      },
    ],
    method: 'POST',
    config: mockConfig,
    operation: mockOperation,
    isWebhook: false,
    securitySchemes: [],
    server: { url: 'https://api.example.com' },
    store: mockStore,
  }

  it('initializes selectedContentType with first available content type', () => {
    const wrapper = mount(ClassicLayout, {
      props: defaultProps,
    })

    // The component should initialize with the first available content type
    expect(wrapper.vm.selectedContentType).toBe('application/json')
  })

  it('has selectedContentType reactive property', () => {
    const wrapper = mount(ClassicLayout, {
      props: defaultProps,
    })

    // Test that the reactive property exists and can be updated
    expect(wrapper.vm.selectedContentType).toBe('application/json')

    // Test that it can be updated
    wrapper.vm.selectedContentType = 'application/xml'
    expect(wrapper.vm.selectedContentType).toBe('application/xml')
  })

  it('handles operation without request body gracefully', () => {
    const operationWithoutBody = {
      ...mockOperation,
      requestBody: undefined,
    }

    const wrapper = mount(ClassicLayout, {
      props: {
        ...defaultProps,
        operation: operationWithoutBody,
      },
    })

    // Should default to 'application/json' when no request body
    expect(wrapper.vm.selectedContentType).toBe('application/json')
  })

  it('handles request body without content gracefully', () => {
    const operationWithEmptyBody = {
      ...mockOperation,
      requestBody: {
        required: true,
      },
    }

    const wrapper = mount(ClassicLayout, {
      props: {
        ...defaultProps,
        operation: operationWithEmptyBody,
      },
    })

    // Should default to 'application/json' when no content types available
    expect(wrapper.vm.selectedContentType).toBe('application/json')
  })
})
