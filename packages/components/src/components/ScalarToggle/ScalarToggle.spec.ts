import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarToggle from './ScalarToggle.vue'

describe('ScalarToggle', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarToggle, {
      props: { modelValue: false },
    })
    expect(wrapper.exists()).toBeTruthy()
  })

  it('does not toggle when disabled', async () => {
    const wrapper = mount(ScalarToggle, {
      props: { modelValue: false, disabled: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders with the correct aria attributes', () => {
    const wrapper = mount(ScalarToggle, {
      props: { modelValue: false, disabled: false },
    })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('aria-checked')).toBe('false')
    expect(input.attributes('aria-disabled')).toBe('false')
  })

  it('applies the correct classes when checked and disabled', () => {
    const wrapper = mount(ScalarToggle, {
      props: { modelValue: true, disabled: true },
    })
    const toggleDiv = wrapper.find('div[role="switch"]')
    expect(toggleDiv.classes()).toContain('bg-c-accent')
    expect(toggleDiv.classes()).toContain('cursor-not-allowed')
    expect(toggleDiv.classes()).toContain('opacity-40')
  })
})
