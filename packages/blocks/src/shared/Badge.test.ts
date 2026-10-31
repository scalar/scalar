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
})
