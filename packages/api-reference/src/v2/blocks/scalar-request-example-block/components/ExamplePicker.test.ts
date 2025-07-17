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
    expect(wrapper.vm.getLabel(null)).toBe('Select an example')
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
    expect(wrapper.vm.selectedExampleKey).toBe('')

    // Update the model value directly
    await wrapper.setProps({
      examples: mockExamples,
      modelValue: 'example-2',
    })

    await nextTick()

    // Verify the selectedExampleKey was updated
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

    // Test that getLabel works with special characters
    expect(wrapper.vm.getLabel('example-with-dashes')).toBe('Dashed Example')
    expect(wrapper.vm.getLabel('example_with_underscores')).toBe('Underscore Example')
    expect(wrapper.vm.getLabel('example.with.dots')).toBe('Dotted Example')
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

    // Should handle null/undefined gracefully in getLabel
    expect(wrapper.vm.getLabel('null-example')).toBe('null-example')
    expect(wrapper.vm.getLabel('undefined-example')).toBe('undefined-example')
  })

  it('generates correct labels for all examples', () => {
    const wrapper = mount(ExamplePicker, {
      props: {
        examples: mockExamples,
        modelValue: '',
      },
    })

    // Test that getLabel generates correct labels for all examples
    expect(wrapper.vm.getLabel('example-1')).toBe('First Example')
    expect(wrapper.vm.getLabel('example-2')).toBe('Second Example')
    expect(wrapper.vm.getLabel('example-3')).toBe('example-3') // Falls back to key when no summary
  })
})
