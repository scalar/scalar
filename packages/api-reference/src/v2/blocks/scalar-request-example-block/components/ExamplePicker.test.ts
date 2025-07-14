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
        modelValue: '',
      },
    })

    expect(wrapper.find('[data-testid="example-picker"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('First Example')
  })

  it('generates correct options from examples', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
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
        modelValue: '',
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
        modelValue: '',
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
        modelValue: '',
      },
    })

    // Test with null key
    expect(wrapper.vm.getLabel(null)).toBe('Select an example')
  })

  it('updates selected example when model value changes', async () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    // Initially no example selected
    expect(wrapper.text()).toContain('First Example')

    // Set a selected example
    await wrapper.setProps({
      examples: mockExamples,
      modelValue: 'example-1',
    })

    // Simulate model update
    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    await combobox.vm.$emit('update:modelValue', { id: 'example-2', label: 'Second Example' })

    await nextTick()

    // The button should now show the selected example
    expect(wrapper.text()).toContain('Second Example')
  })

  it('emits model update when example is selected', async () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    const combobox = wrapper.findComponent({ name: 'ScalarCombobox' })
    const selectedOption = { id: 'example-2', label: 'Second Example' }

    await combobox.vm.$emit('update:modelValue', selectedOption)

    // Verify the selectExample method was called with the correct option
    // This tests the internal logic of the component
    expect(wrapper.vm.selectedExampleKey).toBe('example-2')
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
        modelValue: '',
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
        modelValue: '',
      },
    })

    const vm = wrapper.vm

    // Test when an example is selected
    vm.selectedExampleKey = 'example-1'
    expect(vm.selectedExample).toEqual({
      id: 'example-1',
      label: 'First Example',
    })

    vm.selectedExampleKey = 'example-2'
    expect(vm.selectedExample).toEqual({
      id: 'example-2',
      label: 'Second Example',
    })

    vm.selectedExampleKey = 'example-3'
    expect(vm.selectedExample).toEqual({
      id: 'example-3',
      label: 'example-3',
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
        modelValue: '',
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
