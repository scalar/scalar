import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ModernLayout from './ModernLayout.vue'

describe('ModernLayout', () => {
  const mockOperation = {
    summary: 'Test Operation',
    operationId: 'test-operation',
    parameters: [],
    responses: {},
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
    expandAllResponses: false,
  }

  const mockStore = {
    workspace: {
      'x-scalar-default-client': 'curl',
    },
  }

  const defaultProps = {
    id: 'test-operation',
    path: '/test',
    clientOptions: [],
    method: 'POST',
    config: mockConfig,
    operation: mockOperation,
    isWebhook: false,
    securitySchemes: [],
    server: { url: 'https://api.example.com' },
    store: mockStore,
  }

  it('initializes selectedContentType with first available content type', () => {
    const wrapper = mount(ModernLayout, {
      props: defaultProps,
    })

    // The component should initialize with the first available content type
    expect(wrapper.vm.selectedContentType).toBe('application/json')
  })

  it('passes selectedContentType to OperationCodeSample', () => {
    const wrapper = mount(ModernLayout, {
      props: defaultProps,
    })

    const operationCodeSample = wrapper.findComponent({ name: 'OperationCodeSample' })
    expect(operationCodeSample.props('selectedContentType')).toBe('application/json')
  })

  it('passes selectedContentType to OperationParameters', () => {
    const wrapper = mount(ModernLayout, {
      props: defaultProps,
    })

    const operationParameters = wrapper.findComponent({ name: 'OperationParameters' })
    expect(operationParameters.props('selectedContentType')).toBe('application/json')
  })

  it('updates selectedContentType when OperationParameters emits update', async () => {
    const wrapper = mount(ModernLayout, {
      props: defaultProps,
    })

    const operationParameters = wrapper.findComponent({ name: 'OperationParameters' })
    await operationParameters.vm.$emit('update:selectedContentType', 'application/xml')

    expect(wrapper.vm.selectedContentType).toBe('application/xml')
  })

  it('handles operation without request body gracefully', () => {
    const operationWithoutBody = {
      ...mockOperation,
      requestBody: undefined,
    }

    const wrapper = mount(ModernLayout, {
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

    const wrapper = mount(ModernLayout, {
      props: {
        ...defaultProps,
        operation: operationWithEmptyBody,
      },
    })

    // Should default to 'application/json' when no content types available
    expect(wrapper.vm.selectedContentType).toBe('application/json')
  })
})
