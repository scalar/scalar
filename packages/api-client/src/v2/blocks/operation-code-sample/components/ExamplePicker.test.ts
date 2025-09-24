import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ExamplePicker from './ExamplePicker.vue'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

describe('ExamplePicker', () => {
  const mockExamples: Record<string, ExampleObject> = {
    'example-1': {
      summary: 'First Example',
      description: 'This is the first example',
      value: { key: 'value1' },
    },
    'example-2': {
      summary: 'Second Example',
      description: 'This is the second example',
      value: { key: 'value2' },
    },
    'example-3': {
      // No summary, should fall back to key
      description: 'Example without summary',
      value: { key: 'value3' },
    },
  }

  it('renders with default state', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    expect(wrapper.find('[data-testid="example-picker"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Select an example')
  })

  it('renders dropdown button with correct text', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    const button = wrapper.find('[data-testid="example-picker"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Select an example')
  })

  it('handles empty examples object', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: {},
        modelValue: '',
      },
    })

    expect(wrapper.text()).toContain('Select an example')
  })

  it('handles examples with missing summary', () => {
    const examplesWithoutSummary: Record<string, ExampleObject> = {
      'key-only': {
        description: 'No summary provided',
        value: { test: 'data' },
      },
    }

    const wrapper = mount(ExamplePicker, {
      props: {
        examples: examplesWithoutSummary,
        modelValue: '',
      },
    })

    // The button should show "Select an example" when no example is selected
    expect(wrapper.text()).toContain('Select an example')
  })

  it('handles null key in getLabel function', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    // Test with null key
    expect(wrapper.find('button').text()).toBe('Select an example')
  })

  it('updates selected example when model value changes', async () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    // Initially shows "Select an example"
    expect(wrapper.text()).toContain('Select an example')

    // Set a selected example
    await wrapper.setProps({
      examples: mockExamples,
      modelValue: 'example-1',
    })

    await nextTick()

    // The button should now show the selected example
    expect(wrapper.text()).toContain('First Example')
  })

  it('updates model value when example is selected', async () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    // Initially no example selected
    expect(wrapper.props().modelValue).toBe('')

    // Update the model value directly
    await wrapper.setProps({
      examples: mockExamples,
      modelValue: 'example-2',
    })

    await nextTick()

    // Verify the modelValue was updated
    expect(wrapper.props().modelValue).toBe('example-2')
  })

  it('shows correct label for selected example', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: 'example-1',
      },
    })

    // Should show the summary when available
    expect(wrapper.text()).toContain('First Example')

    // Test with example that has no summary
    const wrapper2 = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: 'example-3',
      },
    })

    // Should fall back to the key when no summary
    expect(wrapper2.text()).toContain('example-3')
  })

  it('handles examples with null or undefined values', async () => {
    const problematicExamples: Record<string, ExampleObject> = {
      'null-example': null as any,
      'undefined-example': undefined as any,
    }

    const wrapper = mount(ExamplePicker, {
      props: {
        examples: problematicExamples,
        modelValue: '',
      },
    })

    await wrapper.find('button[aria-expanded=false]').trigger('click')

    const items = wrapper.findAll('li')

    expect(items.length).toBe(2)
    expect(items[0].text()).toBe('null-example')
    expect(items[1].text()).toBe('undefined-example')
  })
})
