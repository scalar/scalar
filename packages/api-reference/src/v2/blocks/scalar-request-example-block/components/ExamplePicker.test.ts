import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ExamplePicker from './ExamplePicker.vue'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/example'

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
      },
    })

    expect(wrapper.find('[data-testid="example-picker"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Select an example')
  })

  it('generates correct options from examples', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
      },
    })

    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    const options = combobox.props('options')

    expect(options).toHaveLength(3)
    expect(options).toEqual([
      { id: 'example-1', label: 'First Example' },
      { id: 'example-2', label: 'Second Example' },
      { id: 'example-3', label: 'example-3' }, // Falls back to key when no summary
    ])
  })

  it('handles empty examples object', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: {},
      },
    })

    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    const options = combobox.props('options')

    expect(options).toHaveLength(0)
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
      },
    })

    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    const options = combobox.props('options')

    expect(options).toEqual([{ id: 'key-only', label: 'key-only' }])
  })

  it('handles null key in getLabel function', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
      },
    })

    // Access the component instance to test the getLabel method
    const vm = wrapper.vm as any

    // Test with null key
    expect(vm.getLabel(null)).toBe('Select an example')

    // Test with undefined key
    expect(vm.getLabel(undefined)).toBe('Select an example')
  })

  it('updates selected example when model value changes', async () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
      },
    })

    // Initially no example selected
    expect(wrapper.text()).toContain('Select an example')

    // Set a selected example
    await wrapper.setProps({
      examples: mockExamples,
    })

    // Simulate model update
    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    await combobox.vm.$emit('update:modelValue', { id: 'example-1', label: 'First Example' })

    await nextTick()

    // The button should now show the selected example
    expect(wrapper.text()).toContain('First Example')
  })

  it('emits model update when example is selected', async () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
      },
    })

    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    const selectedOption = { id: 'example-2', label: 'Second Example' }

    await combobox.vm.$emit('update:modelValue', selectedOption)

    // Verify the selectExample method was called with the correct option
    // This tests the internal logic of the component
    const vm = wrapper.vm as any
    expect(vm.selectedExampleKey).toBe('example-2')
  })

  it('handles examples with special characters in keys', () => {
    const specialExamples: Record<string, ExampleObject> = {
      'example-with-dashes': {
        summary: 'Dashed Example',
        value: { test: 'data' },
      },
      'example_with_underscores': {
        summary: 'Underscore Example',
        value: { test: 'data' },
      },
      'example.with.dots': {
        summary: 'Dotted Example',
        value: { test: 'data' },
      },
    }

    const wrapper = mount(ExamplePicker, {
      props: {
        examples: specialExamples,
      },
    })

    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    const options = combobox.props('options')

    expect(options).toEqual([
      { id: 'example-with-dashes', label: 'Dashed Example' },
      { id: 'example_with_underscores', label: 'Underscore Example' },
      { id: 'example.with.dots', label: 'Dotted Example' },
    ])
  })

  it('computes selected example correctly', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
      },
    })

    const vm = wrapper.vm as any

    // Test when no example is selected
    expect(vm.selectedExample).toBeUndefined()

    // Test when an example is selected
    vm.selectedExampleKey = 'example-1'
    expect(vm.selectedExample).toEqual({
      id: 'example-1',
      label: 'First Example',
    })
  })

  it('handles examples with null or undefined values', () => {
    const problematicExamples: Record<string, ExampleObject> = {
      'null-example': null as any,
      'undefined-example': undefined as any,
    }

    const wrapper = mount(ExamplePicker, {
      props: {
        examples: problematicExamples,
      },
    })

    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    const options = combobox.props('options')

    // Should handle null/undefined gracefully
    expect(options).toEqual([
      { id: 'null-example', label: 'null-example' },
      { id: 'undefined-example', label: 'undefined-example' },
    ])
  })
})
