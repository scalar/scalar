import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RequestBody from './RequestBody.vue'

describe('RequestBody', () => {
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
  }

  it('renders with default content type when no selectedContentType prop is provided', () => {
    const wrapper = mount(RequestBody, {
      props: {
        requestBody: mockRequestBody,
      },
    })

    expect(wrapper.text()).toContain('application/json')
  })

  it('uses selectedContentType prop when provided', () => {
    const wrapper = mount(RequestBody, {
      props: {
        requestBody: mockRequestBody,
        selectedContentType: 'application/xml',
      },
    })

    expect(wrapper.text()).toContain('application/xml')
  })

  it('emits update:selectedContentType when content type changes', async () => {
    const wrapper = mount(RequestBody, {
      props: {
        requestBody: mockRequestBody,
        selectedContentType: 'application/json',
      },
    })

    // Find the ContentTypeSelect component and trigger a change
    const contentTypeSelect = wrapper.findComponent({ name: 'ContentTypeSelect' })
    await contentTypeSelect.vm.$emit('update:modelValue', 'application/xml')

    expect(wrapper.emitted('update:selectedContentType')).toBeTruthy()
    expect(wrapper.emitted('update:selectedContentType')?.[0]).toEqual(['application/xml'])
  })

  it('uses selectedContentType prop even if not in available types', () => {
    const wrapper = mount(RequestBody, {
      props: {
        requestBody: mockRequestBody,
        selectedContentType: 'text/plain', // Not in available types
      },
    })

    // The component uses the prop as-is, it doesn't validate against available types
    expect(wrapper.text()).toContain('text/plain')
  })

  it('handles request body without content gracefully', () => {
    const wrapper = mount(RequestBody, {
      props: {
        requestBody: { required: true },
        selectedContentType: 'application/json',
      },
    })

    // Should not crash and should show the selected content type
    expect(wrapper.text()).toContain('application/json')
  })
})
