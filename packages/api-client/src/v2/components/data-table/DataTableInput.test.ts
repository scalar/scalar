import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { type VueWrapper, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DataTableInput from './DataTableInput.vue'

const mockEnvironment: XScalarEnvironment = {
  color: '#ff0000',
  variables: [],
}

describe('DataTableInput', () => {
  let wrapper: VueWrapper<InstanceType<typeof DataTableInput>>

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('input functionality', () => {
    it('renders a text input when type is not password', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: '',
          environment: mockEnvironment,
        },
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.exists()).toBe(true)
    })

    it('renders a password input when type is password and mask is true', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret123',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.attributes('type')).toBe('text')
      expect(input.classes()).toContain('scalar-password-input')
    })

    it('renders CodeInput when mask is false for password type', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret123',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      // Click the visibility toggle to unmask
      const toggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Show Password')

      await toggleButton?.trigger('click')
      await wrapper.vm.$nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.exists()).toBe(true)
    })

    it('renders CodeInput for non-password text input', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'test value',
          environment: mockEnvironment,
        },
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.exists()).toBe(true)
    })

    it('emits update:modelValue when text input value changes', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: '',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const input = wrapper.find('input')
      await input.setValue('new value')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
    })

    it('emits update:modelValue when CodeInput value changes', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'initial',
          environment: mockEnvironment,
        },
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', 'updated value')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['updated value'])
    })

    it('emits inputFocus when CodeInput is focused', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'test',
          environment: mockEnvironment,
        },
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('focus')

      expect(wrapper.emitted('inputFocus')).toBeTruthy()
    })

    it('emits inputBlur when CodeInput loses focus', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'test',
          environment: mockEnvironment,
        },
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('blur')

      expect(wrapper.emitted('inputBlur')).toBeTruthy()
    })

    it('renders DataTableInputSelect when enum is provided', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'option1',
          enum: ['option1', 'option2', 'option3'],
          environment: mockEnvironment,
        },
      })

      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.exists()).toBe(true)
      expect(select.props('value')).toEqual(['option1', 'option2', 'option3'])
    })
  })

  describe('clear button', () => {
    it('shows clear button when modelValue has a value', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'some value',
          environment: mockEnvironment,
        },
      })

      const clearButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Clear Value')

      expect(clearButton?.exists()).toBe(true)
    })

    it('does not show clear button when modelValue is empty', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: '',
          environment: mockEnvironment,
        },
      })

      const clearButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Clear Value')

      expect(clearButton).toBeUndefined()
    })

    it('clears the value when clear button is clicked', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'test value',
          environment: mockEnvironment,
        },
      })

      const clearButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Clear Value')

      await clearButton?.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    })

    it('clears the value for password input when clear button is clicked', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'password123',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const clearButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Clear Value')

      await clearButton?.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    })
  })

  describe('visibility toggle button', () => {
    it('shows visibility toggle button when type is password', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const toggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Show Password' || btn.props('label') === 'Hide Password')

      expect(toggleButton?.exists()).toBe(true)
    })

    it('does not show visibility toggle button when type is not password', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'text value',
          environment: mockEnvironment,
        },
      })

      const toggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Show Password' || btn.props('label') === 'Hide Password')

      expect(toggleButton).toBeUndefined()
    })

    it('shows eye icon when password is masked', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const toggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Show Password')

      expect(toggleButton?.exists()).toBe(true)
    })

    it('shows eye-slash icon when password is unmasked', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const toggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Show Password')

      await toggleButton?.trigger('click')
      await wrapper.vm.$nextTick()

      const updatedToggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Hide Password')

      expect(updatedToggleButton?.exists()).toBe(true)
    })

    it('toggles between masked and unmasked input when clicked', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret123',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      // Initially should show masked input
      let input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.classes()).toContain('scalar-password-input')

      // Click toggle to unmask
      const toggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Show Password')

      await toggleButton?.trigger('click')
      await wrapper.vm.$nextTick()

      // Should now show CodeInput instead of masked input
      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.exists()).toBe(true)

      // Click toggle again to mask
      const updatedToggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Hide Password')

      await updatedToggleButton?.trigger('click')
      await wrapper.vm.$nextTick()

      // Should show masked input again
      input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.classes()).toContain('scalar-password-input')
    })
  })
})
