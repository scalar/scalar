import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import DeveloperToolsHovercard from './DeveloperToolsHovercard.vue'

enableAutoUnmount(afterEach)

const mountHovercard = () => mount(DeveloperToolsHovercard, { attachTo: document.body })

describe('DeveloperToolsHovercard', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('names the trigger and starts closed', () => {
    const wrapper = mountHovercard()
    const trigger = wrapper.get('button')

    expect(trigger.text()).toBe('Developer Tools')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.attributes('aria-controls')).toBeUndefined()
  })

  it('opens on focus and explains how to turn the toolbar off', async () => {
    const wrapper = mountHovercard()
    const trigger = wrapper.get('button')

    await trigger.trigger('focus')
    await flushPromises()

    const card = document.getElementById(trigger.attributes('aria-controls') ?? '')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(card?.textContent).toContain('showDeveloperTools: "never"')
  })

  it('closes with Escape and keeps focus on the trigger without reopening', async () => {
    const wrapper = mountHovercard()
    const trigger = wrapper.get('button')
    ;(trigger.element as HTMLElement).focus()
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')

    await trigger.trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger.element)
  })

  it('waits for the pointer to rest before opening, and closes after it leaves', async () => {
    vi.useFakeTimers()
    const wrapper = mountHovercard()
    const trigger = wrapper.get('button')

    await trigger.trigger('pointerenter')
    vi.advanceTimersByTime(50)
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('false')

    vi.advanceTimersByTime(200)
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')

    await trigger.trigger('pointerleave')
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })
})
