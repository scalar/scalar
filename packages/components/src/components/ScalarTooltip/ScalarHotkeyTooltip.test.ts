import { mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import ScalarHotkeyTooltip from './ScalarHotkeyTooltip.vue'
import { cleanupTooltipElement } from './useTooltip'
import { ELEMENT_ID } from './constants'

describe('ScalarHotkeyTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanupTooltipElement()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('renders trigger element and is hidden initially', async () => {
    const wrapper = mount(ScalarHotkeyTooltip, {
      props: {
        hotkey: 'K',
        modifier: [],
        content: 'Tooltip Content',
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('button').text()).toBe('Hover me')

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('none')
  })

  it('respects delay prop before showing', async () => {
    const wrapper = mount(ScalarHotkeyTooltip, {
      props: {
        hotkey: 'K',
        modifier: [],
        content: 'Tooltip Content',
        delay: 200,
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    await nextTick()
    await wrapper.find('button').trigger('mouseenter')

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('none')

    await vi.advanceTimersByTime(200)
    await nextTick()

    expect(tooltip?.style.display).toBe('block')
    expect(tooltip?.textContent).toContain('Tooltip Content')
  })

  it('applies offset CSS variable when shown', async () => {
    const wrapper = mount(ScalarHotkeyTooltip, {
      props: {
        hotkey: 'K',
        modifier: [],
        content: 'Tooltip Content',
        offset: 10,
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    await nextTick()
    await wrapper.find('button').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')
    expect(tooltip?.style.getPropertyValue('--scalar-tooltip-offset')).toBe('10px')
  })

  it('updates rendered content when content prop changes', async () => {
    const wrapper = mount(ScalarHotkeyTooltip, {
      props: {
        hotkey: 'K',
        modifier: [],
        content: 'Initial Content',
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    await nextTick()
    await wrapper.find('button').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')
    expect(tooltip?.textContent).toContain('Initial Content')

    await wrapper.setProps({ content: 'Updated Content' })
    await nextTick()

    expect(tooltip?.textContent).toContain('Updated Content')
  })

  it('handles dynamic trigger element', async () => {
    const wrapper = mount(ScalarHotkeyTooltip, {
      props: {
        hotkey: 'K',
        modifier: [],
        content: 'Tooltip Content',
      },
      slots: {
        default: '<div class="custom-trigger">Hover me</div>',
      },
    })

    await nextTick()

    expect(wrapper.find('.custom-trigger').exists()).toBe(true)
    expect(wrapper.find('.custom-trigger').text()).toBe('Hover me')

    await wrapper.find('.custom-trigger').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')
    expect(tooltip?.textContent).toContain('Tooltip Content')
  })

  it('escapes HTML in content to prevent XSS', async () => {
    const wrapper = mount(ScalarHotkeyTooltip, {
      props: {
        hotkey: 'K',
        modifier: [],
        content: '<script>alert("xss")</script>Safe text',
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    await nextTick()
    await wrapper.find('button').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')
    // Content should be escaped inside the rendered HTML string
    expect(tooltip?.innerHTML).toContain('&lt;script&gt;alert("xss")&lt;/script&gt;Safe text')
    expect(tooltip?.textContent).toContain('Safe text')
  })

  it('renders only the hotkey when no content is provided', async () => {
    const wrapper = mount(ScalarHotkeyTooltip, {
      props: {
        hotkey: 'K',
        modifier: [],
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    await nextTick()
    await wrapper.find('button').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')
    // The hotkey should be visible in the tooltip text content
    expect(tooltip?.textContent?.toLowerCase()).toContain('k')
  })
})
