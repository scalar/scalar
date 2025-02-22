import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarVirtualText from './ScalarVirtualText.vue'

describe('ScalarVirtualText', () => {
  it('renders properly with default props', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: {
        text: 'Hello\nWorld',
      },
    })

    expect(wrapper.find('.scalar-virtual-text').exists()).toBe(true)
    expect(wrapper.find('.scalar-virtual-text-content').exists()).toBe(true)
    expect(wrapper.findAll('.scalar-virtual-text-line')).toHaveLength(2)
  })

  it('applies custom classes', () => {
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

  it('respects custom line height', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: {
        text: 'Test',
        lineHeight: 30,
      },
    })

    const line = wrapper.find('.scalar-virtual-text-line')
    expect(line.attributes('style')).toContain('height: 30px')
    expect(line.attributes('style')).toContain('line-height: 30px')
  })

  it('handles empty text', () => {
    const wrapper = mount(ScalarVirtualText, {
      props: {
        text: '',
      },
    })

    expect(wrapper.findAll('.scalar-virtual-text-line')).toHaveLength(1)
    expect(wrapper.find('.scalar-virtual-text-line').text()).toBe('')
  })

  it('updates visible lines on scroll', async () => {
    const longText = Array(100).fill('Line').join('\n')
    const wrapper = mount(ScalarVirtualText, {
      props: {
        text: longText,
      },
    })

    const container = wrapper.find('.scalar-virtual-text')

    // Mock the scrollTop and clientHeight
    Object.defineProperty(container.element, 'scrollTop', {
      value: 500,
      writable: true,
    })
    Object.defineProperty(container.element, 'clientHeight', {
      value: 200,
      writable: true,
    })

    // Trigger scroll event
    await container.trigger('scroll')

    // Check if the content is translated
    const content = wrapper.find('.scalar-virtual-text-content')
    expect(content.attributes('style')).toContain('transform: translateY')
  })

  it('updates container height on window resize', async () => {
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')

    const wrapper = mount(ScalarVirtualText, {
      props: {
        text: 'Test',
      },
    })

    expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))

    wrapper.unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
