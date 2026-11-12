import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SidebarItemBadges from './SidebarItemBadges.vue'

describe('SidebarItemBadges', () => {
  const badges = [
    { name: 'Beta', color: '#f59e0b' },
    { name: 'Alpha', position: 'before' as const },
    { name: 'New', position: 'after' as const },
  ]

  it('renders badges without a position or with position after in the after slot', () => {
    const wrapper = mount(SidebarItemBadges, { props: { badges, position: 'after' } })

    expect(wrapper.findAll('.sidebar-badge').map((badge) => badge.text())).toStrictEqual(['Beta', 'New'])
  })

  it('renders only badges with position before in the before slot', () => {
    const wrapper = mount(SidebarItemBadges, { props: { badges, position: 'before' } })

    expect(wrapper.findAll('.sidebar-badge').map((badge) => badge.text())).toStrictEqual(['Alpha'])
  })

  it('passes the badge color as a custom property', () => {
    const wrapper = mount(SidebarItemBadges, { props: { badges, position: 'after' } })
    const [colored, plain] = wrapper.findAll('.sidebar-badge')

    expect(colored?.classes()).toContain('sidebar-badge-colored')
    expect(colored?.attributes('style')).toContain('--badge-color: #f59e0b')
    expect(plain?.classes()).not.toContain('sidebar-badge-colored')
    expect(plain?.attributes('style')).toBeUndefined()
  })

  it('renders nothing when no badge matches the position', () => {
    const wrapper = mount(SidebarItemBadges, { props: { badges: [{ name: 'Beta' }], position: 'before' } })

    expect(wrapper.find('.sidebar-badge').exists()).toBe(false)
  })
})
