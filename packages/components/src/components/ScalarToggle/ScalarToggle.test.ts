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

  it('renders the small size by default', () => {
    const wrapper = mount(ScalarToggle, {
      props: { modelValue: true },
    })
    expect(wrapper.classes()).toContain('h-3.5')
    expect(wrapper.classes()).toContain('w-6')
    expect(wrapper.find('div').classes()).toContain('size-3')
    expect(wrapper.find('div').classes()).toContain('translate-x-2.5')
  })

  it('renders the medium size with a matching thumb travel', () => {
    const off = mount(ScalarToggle, {
      props: { modelValue: false, size: 'md' },
    })
    expect(off.classes()).toContain('h-5')
    expect(off.classes()).toContain('w-8')
    expect(off.classes()).not.toContain('h-3.5')
    expect(off.find('div').classes()).toContain('size-4')
    expect(off.find('div').classes()).not.toContain('translate-x-3')

    const on = mount(ScalarToggle, {
      props: { modelValue: true, size: 'md' },
    })
    expect(on.find('div').classes()).toContain('translate-x-3')
    expect(on.find('div').classes()).not.toContain('translate-x-2.5')
  })
})
