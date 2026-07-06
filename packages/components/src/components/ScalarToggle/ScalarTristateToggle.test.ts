import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarTristateToggle from './ScalarTristateToggle.vue'

describe('ScalarTristateToggle', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarTristateToggle, {
      props: { modelValue: undefined },
    })
    expect(wrapper.exists()).toBeTruthy()
  })

  it('does not toggle when disabled', async () => {
    const wrapper = mount(ScalarTristateToggle, {
      props: { modelValue: undefined, disabled: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('cycles unset -> on -> off -> unset', async () => {
    const wrapper = mount(ScalarTristateToggle, {
      props: { modelValue: undefined },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])

    await wrapper.setProps({ modelValue: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false])

    await wrapper.setProps({ modelValue: false })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[2]).toEqual([undefined])
  })

  it('renders with the correct role and aria attributes', () => {
    const unset = mount(ScalarTristateToggle, {
      props: { modelValue: undefined, disabled: false },
    })
    expect(unset.attributes('role')).toBe('checkbox')
    expect(unset.attributes('aria-checked')).toBe('mixed')
    expect(unset.attributes('aria-disabled')).toBe('false')

    const on = mount(ScalarTristateToggle, {
      props: { modelValue: true },
    })
    expect(on.attributes('aria-checked')).toBe('true')

    const off = mount(ScalarTristateToggle, {
      props: { modelValue: false },
    })
    expect(off.attributes('aria-checked')).toBe('false')
  })

  it('applies the correct slider color and thumb position per state', () => {
    const unset = mount(ScalarTristateToggle, {
      props: { modelValue: undefined },
    })
    expect(unset.classes()).toContain('bg-b-3')
    expect(unset.find('div').classes()).toContain('translate-x-1.25')

    const on = mount(ScalarTristateToggle, {
      props: { modelValue: true },
    })
    expect(on.classes()).toContain('bg-green')
    expect(on.find('div').classes()).toContain('translate-x-2.5')

    const off = mount(ScalarTristateToggle, {
      props: { modelValue: false },
    })
    expect(off.classes()).toContain('bg-c-danger')
    expect(off.find('div').classes()).not.toContain('translate-x-1.25')
    expect(off.find('div').classes()).not.toContain('translate-x-2.5')
  })

  it('applies disabled styling', () => {
    const wrapper = mount(ScalarTristateToggle, {
      props: { modelValue: undefined, disabled: true },
    })
    expect(wrapper.classes()).toContain('cursor-not-allowed')
    expect(wrapper.classes()).toContain('opacity-40')
  })
})
