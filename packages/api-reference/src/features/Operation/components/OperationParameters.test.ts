import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationParameters from './OperationParameters.vue'

describe('OperationParameters', () => {
  const mockRequestBody = {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    required: true,
  }

  const mockParameters = [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    },
  ]

  it('passes selectedContentType prop to RequestBody component', () => {
    const wrapper = mount(OperationParameters, {
      props: {
        parameters: mockParameters,
        requestBody: mockRequestBody,
        selectedContentType: 'application/json',
      },
    })

    const requestBodyComponent = wrapper.findComponent({ name: 'RequestBody' })
    expect(requestBodyComponent.props('selectedContentType')).toBe('application/json')
  })

  it('emits update:selectedContentType when RequestBody emits it', async () => {
    const wrapper = mount(OperationParameters, {
      props: {
        parameters: mockParameters,
        requestBody: mockRequestBody,
        selectedContentType: 'application/json',
      },
    })

    const requestBodyComponent = wrapper.findComponent({ name: 'RequestBody' })
    await requestBodyComponent.vm.$emit('update:selectedContentType', 'application/xml')

    expect(wrapper.emitted('update:selectedContentType')).toBeTruthy()
    expect(wrapper.emitted('update:selectedContentType')?.[0]).toEqual(['application/xml'])
  })

  it('renders without request body when not provided', () => {
    const wrapper = mount(OperationParameters, {
      props: {
        parameters: mockParameters,
        selectedContentType: 'application/json',
      },
    })

    const requestBodyComponent = wrapper.findComponent({ name: 'RequestBody' })
    expect(requestBodyComponent.exists()).toBe(false)
  })

  it('renders with request body when provided', () => {
    const wrapper = mount(OperationParameters, {
      props: {
        parameters: mockParameters,
        requestBody: mockRequestBody,
        selectedContentType: 'application/json',
      },
    })

    const requestBodyComponent = wrapper.findComponent({ name: 'RequestBody' })
    expect(requestBodyComponent.exists()).toBe(true)
  })
})
