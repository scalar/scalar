import { mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import ScalarTooltip from './ScalarTooltip.vue'
import { cleanupTooltipElement } from './useTooltip'
import { ELEMENT_ID } from './constants'

describe('ScalarTooltip', () => {
  beforeEach(() => {
    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Cleanup the tooltip element
    cleanupTooltipElement()
    document.body.innerHTML = ''

    // Restore the real timers
    vi.useRealTimers()
  })

  it('renders trigger element and tooltip content', async () => {
    const wrapper = mount(ScalarTooltip, {
      props: {
        content: 'Tooltip Content',
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    // Check trigger element
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('button').text()).toBe('Hover me')

    // Content should not be visible initially
    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('none')
  })

  it('passes delay prop to tooltip', async () => {
    const wrapper = mount(ScalarTooltip, {
      props: {
        content: 'Tooltip Content',
        delay: 200,
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    // Wait for the event listeners to be added
    await nextTick()

    // Trigger mouseenter
    await wrapper.find('button').trigger('mouseenter')

    // Tooltip should not be visible immediately
    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('none')

    // Fast forward past the delay
    await vi.advanceTimersByTime(200)
    await nextTick()

    // Tooltip should now be visible
    expect(tooltip?.style.display).toBe('block')
    expect(tooltip?.textContent).toBe('Tooltip Content')
  })

  it('passes offset prop to tooltip', async () => {
    const wrapper = mount(ScalarTooltip, {
      props: {
        content: 'Tooltip Content',
        offset: 10,
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    // Wait for the event listeners to be added
    await nextTick()

    // Show tooltip
    await wrapper.find('button').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')
    expect(tooltip?.style.getPropertyValue('--scalar-tooltip-offset')).toBe('10px')
  })

  it('updates tooltip content when content prop changes', async () => {
    const wrapper = mount(ScalarTooltip, {
      props: {
        content: 'Initial Content',
      },
      slots: {
        default: '<button>Hover me</button>',
      },
    })

    // Wait for the event listeners to be added
    await nextTick()

    // Show tooltip
    await wrapper.find('button').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')

    // Update content prop
    await wrapper.setProps({
      content: 'Updated Content',
    })
    await nextTick()

    expect(tooltip?.textContent).toBe('Updated Content')
  })

  it('handles dynamic trigger element', async () => {
    const wrapper = mount(ScalarTooltip, {
      props: {
        content: 'Tooltip Content',
      },
      slots: {
        default: '<div class="custom-trigger">Hover me</div>',
      },
    })

    // Wait for the event listeners to be added
    await nextTick()

    // Check trigger element
    expect(wrapper.find('.custom-trigger').exists()).toBe(true)
    expect(wrapper.find('.custom-trigger').text()).toBe('Hover me')

    // Show tooltip
    await wrapper.find('.custom-trigger').trigger('mouseenter')
    await vi.runAllTimers()
    await nextTick()

    const tooltip = document.getElementById(ELEMENT_ID)
    expect(tooltip?.style.display).toBe('block')
    expect(tooltip?.textContent).toBe('Tooltip Content')
  })
})
