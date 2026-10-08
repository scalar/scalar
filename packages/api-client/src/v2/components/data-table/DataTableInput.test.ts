import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { type VueWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DataTableInput from './DataTableInput.vue'

enableAutoUnmount(afterEach)

const mockEnvironment: XScalarEnvironment = {
  color: '#ff0000',
  variables: [],
}

describe('DataTableInput', () => {
  let wrapper: VueWrapper<InstanceType<typeof DataTableInput>>

  describe('input functionality', () => {
    it('renders a text input when type is not password', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: '',
          environment: mockEnvironment,
        },
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInputLite' })
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

      const codeInput = wrapper.findComponent({ name: 'CodeInputLite' })
      expect(codeInput.exists()).toBe(true)
    })

    it('renders CodeInput for non-password text input', () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'test value',
          environment: mockEnvironment,
        },
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInputLite' })
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

      const codeInput = wrapper.findComponent({ name: 'CodeInputLite' })
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

      const codeInput = wrapper.findComponent({ name: 'CodeInputLite' })
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

      const codeInput = wrapper.findComponent({ name: 'CodeInputLite' })
      await codeInput.vm.$emit('blur')

      expect(wrapper.emitted('inputBlur')).toBeTruthy()
    })

    it('focuses the masked password input when the label is clicked', async () => {
      wrapper = mount(DataTableInput, {
        attachTo: document.body,
        props: {
          modelValue: 'secret123',
          type: 'password',
          environment: mockEnvironment,
        },
        slots: {
          default: 'Password',
        },
      })

      const label = wrapper.findAll('div').find((div) => div.text() === 'Password:')
      await label?.trigger('click')

      expect(document.activeElement).toBe(wrapper.find('input').element)
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

  describe('clear button', () => {
    it('moves focus to the masked field after clearing a revealed secret', async () => {
      wrapper = mount(DataTableInput, {
        attachTo: document.body,
        props: {
          modelValue: 'secret',
          type: 'password',
          environment: mockEnvironment,
          'onUpdate:modelValue': (value: string | number) => wrapper.setProps({ modelValue: String(value) }),
        },
      })

      const button = (label: string) =>
        wrapper.findAllComponents({ name: 'ScalarIconButton' }).find((btn) => btn.props('label') === label)

      await button('Show Password')?.trigger('click')
      await button('Clear Value')?.trigger('click')
      await flushPromises()

      // The clear button is gone, so focus lands on the field instead of the page
      expect(button('Clear Value')).toBeUndefined()
      expect(document.activeElement).toBe(wrapper.get('input').element)
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

    it('reports the revealed state through aria-pressed', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const toggleButton = () =>
        wrapper.findAllComponents({ name: 'ScalarIconButton' }).find((btn) => btn.props('label') === 'Show Password')

      expect(toggleButton()?.attributes('aria-pressed')).toBe('false')

      await toggleButton()?.trigger('click')
      await wrapper.vm.$nextTick()

      // The name stays put so the button keeps one identity; only the state flips.
      expect(toggleButton()?.attributes('aria-pressed')).toBe('true')
    })

    it('hides the visibility toggle while the field is empty', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: '',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const toggleButton = () =>
        wrapper.findAllComponents({ name: 'ScalarIconButton' }).find((btn) => btn.props('label') === 'Show Password')

      expect(toggleButton()).toBeUndefined()

      await wrapper.setProps({ modelValue: 'secret' })

      expect(toggleButton()?.exists()).toBe(true)
    })

    it('masks the field again once its value is cleared', async () => {
      wrapper = mount(DataTableInput, {
        props: {
          modelValue: 'secret',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const toggleButton = () =>
        wrapper.findAllComponents({ name: 'ScalarIconButton' }).find((btn) => btn.props('label') === 'Show Password')

      await toggleButton()?.trigger('click')
      expect(toggleButton()?.attributes('aria-pressed')).toBe('true')

      await wrapper.setProps({ modelValue: '' })
      await wrapper.setProps({ modelValue: 'pasted-secret' })

      expect(toggleButton()?.attributes('aria-pressed')).toBe('false')
      expect(wrapper.findComponent({ name: 'CodeInputLite' }).exists()).toBe(false)
    })

    it('keeps the revealed editor while the field is emptied by typing', async () => {
      wrapper = mount(DataTableInput, {
        attachTo: document.body,
        props: {
          modelValue: 'secret',
          type: 'password',
          environment: mockEnvironment,
        },
      })

      const toggleButton = () =>
        wrapper.findAllComponents({ name: 'ScalarIconButton' }).find((btn) => btn.props('label') === 'Show Password')

      await toggleButton()?.trigger('click')
      const editor = wrapper.get<HTMLElement>('[contenteditable]').element
      editor.focus()

      // Deleting the last character must not swap the editor out from under the caret
      await wrapper.setProps({ modelValue: '' })
      expect(wrapper.findComponent({ name: 'CodeInputLite' }).exists()).toBe(true)
      expect(document.activeElement).toBe(editor)

      // Once focus leaves the empty field it masks, so the next value stays hidden
      editor.blur()
      await wrapper.setProps({ modelValue: 'next-secret' })
      expect(toggleButton()?.attributes('aria-pressed')).toBe('false')
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
      const codeInput = wrapper.findComponent({ name: 'CodeInputLite' })
      expect(codeInput.exists()).toBe(true)

      // Click toggle again to mask
      const updatedToggleButton = wrapper
        .findAllComponents({ name: 'ScalarIconButton' })
        .find((btn) => btn.props('label') === 'Show Password')

      await updatedToggleButton?.trigger('click')
      await wrapper.vm.$nextTick()

      // Should show masked input again
      input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.classes()).toContain('scalar-password-input')
    })
  })
})
