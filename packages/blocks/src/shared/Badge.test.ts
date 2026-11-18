import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Badge from './Badge.vue'

describe('Badge', () => {
  it('keeps an explicit color when the color prop changes', async () => {
    const wrapper = mount(Badge, { props: { color: '#ffcc00' }, slots: { default: 'Gamma' } })
    expect(wrapper.text()).toBe('Gamma')
    expect(wrapper.attributes('style')).toContain('--badge-color: #ffcc00')
    await wrapper.setProps({ color: 'black' })
    expect(wrapper.attributes('style')).toContain('--badge-color: black')
    await wrapper.setProps({ color: undefined })
    expect(wrapper.attributes('style') || '').not.toContain('--badge-color')
  })

  it('swaps the themed colors for the explicit color', async () => {
    const wrapper = mount(Badge, { props: { color: '#ffcc00' } })
    // The themed utilities must be gone, not just outranked, because consumers may load them later
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['bg-(--badge-color)', 'text-auto-contrast-(--badge-color)']),
    )
    expect(wrapper.classes()).not.toContain('bg-b-2')
    expect(wrapper.classes()).not.toContain('text-c-2')

    await wrapper.setProps({ color: undefined })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['bg-b-2', 'text-c-2']))
    expect(wrapper.classes()).not.toContain('text-auto-contrast-(--badge-color)')
  })
})
