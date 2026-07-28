import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ContextBar from './ContextBar.vue'

describe('ContextBar', () => {
  const chainOf = (...titles: string[]) => titles.map((title) => ({ id: title.toLowerCase(), title }))

  it('renders nothing for a top-level section', () => {
    const wrapper = mount(ContextBar, { props: { chain: chainOf('Planets') } })

    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('shows the full trail when it is short enough', () => {
    const wrapper = mount(ContextBar, { props: { chain: chainOf('Galaxy', 'Planets', 'Moons') } })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Galaxy')
    expect(wrapper.text()).toContain('Planets')
    expect(wrapper.text()).toContain('Moons')
    expect(wrapper.text()).not.toContain('…')
  })

  it('renders the current section as text, not a link', () => {
    const wrapper = mount(ContextBar, { props: { chain: chainOf('Galaxy', 'Planets', 'Moons') } })

    // Ancestors are buttons; the current section is not.
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Moons')
  })

  it('collapses the middle of a deep trail into an ellipsis', () => {
    const wrapper = mount(ContextBar, {
      props: { chain: chainOf('Galaxy', 'Planets', 'Moons', 'Craters', 'Regolith') },
    })

    const text = wrapper.text()
    expect(text).toContain('Galaxy')
    expect(text).toContain('…')
    expect(text).toContain('Craters')
    expect(text).toContain('Regolith')
    // The hidden middle links are gone, so only the two visible ancestors remain clickable.
    expect(text).not.toContain('Planets')
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('emits the ancestor id when a crumb is clicked', async () => {
    const onNavigate = vi.fn()
    const wrapper = mount(ContextBar, {
      props: { chain: chainOf('Galaxy', 'Planets', 'Moons'), onNavigate },
    })

    await wrapper.findAll('button')[0]?.trigger('click')

    expect(onNavigate).toHaveBeenCalledWith('galaxy')
  })
})
