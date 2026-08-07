import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ContextBar from './ContextBar.vue'

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ContextBar', () => {
  const chainOf = (...titles: string[]) => titles.map((title) => ({ id: title.toLowerCase(), title }))

  it('keeps its layout slot mounted with an empty chain', () => {
    const wrapper = mount(ContextBar, { props: { chain: [] } })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('nav').attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toBe('')
  })

  it('shows a lone top-level crumb as the current section', () => {
    const wrapper = mount(ContextBar, { props: { chain: chainOf('Galaxy') } })

    expect(wrapper.find('nav').attributes('aria-hidden')).toBe('false')
    // A single crumb is the section in view, so it renders as text, not a link.
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Galaxy')
  })

  it('reuses the reserved slot when the nested chain becomes active', async () => {
    const wrapper = mount(ContextBar, { props: { chain: [] } })
    const nav = wrapper.find('nav').element

    await wrapper.setProps({ chain: chainOf('Galaxy', 'Planets') })

    expect(wrapper.find('nav').element).toBe(nav)
    expect(wrapper.find('nav').attributes('aria-hidden')).toBe('false')
    expect(wrapper.text()).toContain('Galaxy')
    expect(wrapper.text()).toContain('Planets')
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

  it('keeps the full trail when it fits (no forced truncation by count)', () => {
    // Truncation is width-driven; without an overflowing layout the whole trail shows.
    const wrapper = mount(ContextBar, {
      props: { chain: chainOf('Galaxy', 'Planets', 'Moons', 'Craters', 'Regolith') },
    })

    const text = wrapper.text()
    expect(text).toContain('Planets')
    expect(text).toContain('Moons')
    expect(text).not.toContain('…')
  })

  it('emits the ancestor id when a crumb is clicked', async () => {
    const onNavigate = vi.fn()
    const wrapper = mount(ContextBar, {
      props: { chain: chainOf('Galaxy', 'Planets', 'Moons'), onNavigate },
    })

    await wrapper.findAll('button')[0]?.trigger('click')

    expect(onNavigate).toHaveBeenCalledWith('galaxy')
  })

  it('marks the bar as stuck when it reaches its sticky offset', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback)
        return frames.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const wrapper = mount(ContextBar, {
      props: { chain: chainOf('Galaxy', 'Planets') },
    })
    const nav = wrapper.find('nav').element
    const getBoundingClientRect = vi.spyOn(nav, 'getBoundingClientRect')

    getBoundingClientRect.mockReturnValue({ top: 20 } as DOMRect)
    frames.splice(0).forEach((callback) => callback(0))
    await nextTick()

    expect(nav.hasAttribute('data-stuck')).toBe(false)

    getBoundingClientRect.mockReturnValue({ top: 0 } as DOMRect)
    window.dispatchEvent(new Event('scroll'))
    frames.splice(0).forEach((callback) => callback(0))
    await nextTick()

    expect(nav.hasAttribute('data-stuck')).toBe(true)
  })
})
