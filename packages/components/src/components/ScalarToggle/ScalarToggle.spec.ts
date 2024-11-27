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
    expect(wrapper.attributes('aria-checked')).toBe('false')
    expect(wrapper.attributes('aria-disabled')).toBe('false')
  })

  it('applies the correct classes when checked and disabled', () => {
    const wrapper = mount(ScalarToggle, {
      props: { modelValue: true, disabled: true },
    })
    expect(wrapper.classes()).toContain('bg-c-accent')
    expect(wrapper.classes()).toContain('cursor-not-allowed')
    expect(wrapper.classes()).toContain('opacity-40')
  })
})
