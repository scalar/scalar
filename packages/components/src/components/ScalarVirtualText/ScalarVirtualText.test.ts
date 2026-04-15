import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarVirtualText from './ScalarVirtualText.vue'

describe('ScalarVirtualText', () => {
  it('renders lines from text prop', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'Hello\nWorld' },
    })

    const lines = wrapper.findAll('.scalar-virtual-text-line')
    expect(lines.length).toBe(2)
    expect(lines[0]?.text()).toBe('Hello')
    expect(lines[1]?.text()).toBe('World')
  })

  it('renders a single empty line for empty text', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: '' },
    })

    const lines = wrapper.findAll('.scalar-virtual-text-line')
    expect(lines.length).toBe(1)
    expect(lines[0]?.text()).toBe('')
  })

  it('applies custom classes to container, content, and lines', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: {
        text: 'Test',
        containerClass: 'custom-container',
        contentClass: 'custom-content',
        lineClass: 'custom-line',
      },
    })

    expect(wrapper.find('.scalar-virtual-text').classes()).toContain('custom-container')
    expect(wrapper.find('.scalar-virtual-text-content').classes()).toContain('custom-content')
    expect(wrapper.find('.scalar-virtual-text-line').classes()).toContain('custom-line')
  })

  it('applies custom line height to each line', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'A\nB', lineHeight: 32 },
    })

    const style = wrapper.find('.scalar-virtual-text-line').attributes('style')
    expect(style).toContain('height: 32px')
    expect(style).toContain('line-height: 32px')
  })

  it('sets the spacer height to total lines times line height', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'A\nB\nC', lineHeight: 20 },
    })

    // The spacer is the first direct child div (after search), check via parent
    const container = wrapper.find('.scalar-virtual-text')
    const spacerDiv = container.element.querySelector(':scope > div:not(.scalar-virtual-text-search)') as HTMLElement

    expect(spacerDiv?.style.height).toBe('60px')
  })

  it('translates content to 0px when at the top', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: Array(50).fill('line').join('\n') },
    })

    const content = wrapper.find('.scalar-virtual-text-content')
    expect(content.attributes('style')).toContain('translateY(0px)')
  })

  it('updates transform offset after scroll', async () => {
    const text = Array(200).fill('line').join('\n')
    const wrapper = mount(ScalarVirtualText, {
      props: { text, lineHeight: 20 },
    })

    const container = wrapper.find('.scalar-virtual-text')

    Object.defineProperty(container.element, 'scrollTop', {
      value: 600,
      writable: true,
    })
    Object.defineProperty(container.element, 'clientHeight', {
      value: 400,
      writable: true,
    })

    await container.trigger('scroll')

    const content = wrapper.find('.scalar-virtual-text-content')
    const style = content.attributes('style') ?? ''
    // scrollTop=600, lineHeight=20 → visibleStart=30, renderStart=30-10=20
    // offset = 20 * 20 = 400
    expect(style).toContain('translateY(400px)')
  })

  it('does not render all lines for large text (virtualisation)', () => {
    const text = Array(10_000).fill('x').join('\n')
    const wrapper = mount(ScalarVirtualText, {
      props: { text, lineHeight: 20 },
    })

    const renderedLines = wrapper.findAll('.scalar-virtual-text-line')
    // Without scrolling, only the visible window + buffer should render,
    // far fewer than 10 000
    expect(renderedLines.length).toBeLessThan(100)
  })

  it('registers and removes the resize listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'Test' },
    })

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    wrapper.unmount()

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('does not show search bar by default', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'Hello', searchable: true },
    })

    expect(wrapper.findComponent({ name: 'ScalarVirtualTextSearch' }).exists()).toBe(false)
  })

  it('opens search bar on Cmd+F when searchable', async () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'Hello world', searchable: true },
    })

    await wrapper.find('.scalar-virtual-text').trigger('keydown', { key: 'f', metaKey: true })

    expect(wrapper.findComponent({ name: 'ScalarVirtualTextSearch' }).exists()).toBe(true)
  })

  it('closes search bar on Escape', async () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'Hello world', searchable: true },
    })

    // Open
    await wrapper.find('.scalar-virtual-text').trigger('keydown', { key: 'f', metaKey: true })

    expect(wrapper.findComponent({ name: 'ScalarVirtualTextSearch' }).exists()).toBe(true)

    // Close
    await wrapper.find('.scalar-virtual-text').trigger('keydown', { key: 'Escape' })

    expect(wrapper.findComponent({ name: 'ScalarVirtualTextSearch' }).exists()).toBe(false)
  })

  it('does not open search when searchable is false', async () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'Hello world', searchable: false },
    })

    await wrapper.find('.scalar-virtual-text').trigger('keydown', { key: 'f', metaKey: true })

    expect(wrapper.findComponent({ name: 'ScalarVirtualTextSearch' }).exists()).toBe(false)
  })

  it('highlights matching text when searching', async () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'foo bar foo', searchable: true },
    })

    // Open search
    await wrapper.find('.scalar-virtual-text').trigger('keydown', { key: 'f', metaKey: true })

    const search = wrapper.findComponent({ name: 'ScalarVirtualTextSearch' })
    const input = search.find('input')
    await input.setValue('foo')

    const highlights = wrapper.findAll('.scalar-virtual-text-highlight')
    expect(highlights.length).toBe(2)
    expect(highlights[0]?.text()).toBe('foo')
    expect(highlights[1]?.text()).toBe('foo')
  })

  it('does not produce overlapping matches for repeated characters', async () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'aaa', searchable: true },
    })

    await wrapper.find('.scalar-virtual-text').trigger('keydown', { key: 'f', metaKey: true })

    const input = wrapper.findComponent({ name: 'ScalarVirtualTextSearch' }).find('input')
    await input.setValue('aa')

    const highlights = wrapper.findAll('.scalar-virtual-text-highlight')
    expect(highlights.length).toBe(1)
    expect(highlights[0]?.text()).toBe('aa')

    const line = wrapper.find('.scalar-virtual-text-line')
    expect(line.text()).toBe('aaa')
  })

  it('marks the first match as active', async () => {
    const wrapper = mount(ScalarVirtualText, {
      props: { text: 'aaa bbb aaa', searchable: true },
    })

    await wrapper.find('.scalar-virtual-text').trigger('keydown', { key: 'f', metaKey: true })

    const input = wrapper.findComponent({ name: 'ScalarVirtualTextSearch' }).find('input')
    await input.setValue('aaa')

    const active = wrapper.findAll('.scalar-virtual-text-highlight-active')
    expect(active.length).toBe(1)
    expect(active[0]?.text()).toBe('aaa')
  })
})
