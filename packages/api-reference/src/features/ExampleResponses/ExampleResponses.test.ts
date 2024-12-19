import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExampleResponses from './ExampleResponses.vue'

// Mock data based on OpenAPI 3.1 specification
const mockResponses = {
  '200': {
    description: 'Successful response',
    content: {
      'application/json': {
        example: { message: 'Success' },
        examples: {
          example1: { value: { message: 'Example 1' } },
          example2: { value: { message: 'Example 2' } },
        },
      },
    },
  },
  '400': {
    description: 'Bad Request',
    content: {
      'application/json': {
        example: { error: 'Invalid input' },
      },
    },
  },
  '500': {
    description: 'Internal Server Error',
    content: {
      'text/plain': {
        example: 'Server error',
      },
    },
  },
}

describe('ExampleResponses', () => {
  it('renders the correct number of status code tabs', () => {
    const wrapper = mount(ExampleResponses, {
      props: { responses: mockResponses },
    })
    const tabs = wrapper.findAllComponents({ name: 'CardTab' })
    expect(tabs.length).toBe(Object.keys(mockResponses).length)
  })

  it('displays the correct example for a selected status code', async () => {
    const wrapper = mount(ExampleResponses, {
      props: { responses: mockResponses },
    })
    const firstTab = wrapper.findComponent({ name: 'CardTab' })
    await firstTab.trigger('click')
    console.log(wrapper.html())
    expect(wrapper.text()).toContain('Success')
  })

  it('handles multiple examples correctly', async () => {
    const wrapper = mount(ExampleResponses, {
      props: { responses: mockResponses },
    })
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
    await examplePicker.vm.$emit('update:modelValue', 'example2')
    expect(wrapper.text()).toContain('Example 2')
  })

  it('displays schema when checkbox is checked', async () => {
    const wrapper = mount(ExampleResponses, {
      props: { responses: mockResponses },
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(
      true,
    )
  })
})
