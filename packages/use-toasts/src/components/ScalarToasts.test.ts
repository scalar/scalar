/** @vitest-environment jsdom */
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import { provideToasts, useToasts } from '../hooks/useToasts'
import ScalarToasts from './ScalarToasts.vue'

const mountEmbedded = () => {
  let notify = useToasts().toast
  const Consumer = defineComponent({
    setup() {
      notify = useToasts().toast
      return () => h(ScalarToasts)
    },
  })
  const Provider = defineComponent({
    setup() {
      provideToasts()
      return () => h(Consumer)
    },
  })
  const wrapper = mount(Provider)
  return { wrapper, notify }
}

describe('ScalarToasts', () => {
  afterEach(() => vi.useRealTimers())

  it('keeps embedded notifications out of sibling and default renderers', async () => {
    const first = mountEmbedded()
    const second = mountEmbedded()
    const defaultToast = vi.fn()
    const unregister = useToasts().initializeToasts(defaultToast)

    first.notify('First notification', 'error', { description: 'Details' })
    second.notify('Second notification', 'warn')
    await nextTick()

    expect(first.wrapper.find('[role="alert"]').text()).toContain('First notification')
    expect(first.wrapper.find('[role="alert"]').text()).toContain('Details')
    expect(first.wrapper.text().includes('Second notification')).toBe(false)
    expect(second.wrapper.find('[role="status"]').text()).toContain('Second notification')
    expect(second.wrapper.text().includes('First notification')).toBe(false)
    expect(defaultToast).not.toHaveBeenCalled()

    await first.wrapper.get('button').trigger('click')
    expect(first.wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(second.wrapper.find('[role="status"]').text()).toContain('Second notification')
    first.wrapper.unmount()
    second.wrapper.unmount()
    unregister()
  })

  it('pauses expiry while hovered or focused and releases timers on unmount', async () => {
    vi.useFakeTimers()
    const { wrapper, notify } = mountEmbedded()
    notify('Read this', 'info', { timeout: 1000 })
    await nextTick()
    await vi.advanceTimersByTimeAsync(400)
    await wrapper.get('[role="status"]').trigger('pointerenter')
    await wrapper.get('button').trigger('focusin')
    await vi.advanceTimersByTimeAsync(2000)
    await wrapper.get('[role="status"]').trigger('pointerleave')
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await wrapper.get('button').trigger('focusout')
    await vi.advanceTimersByTimeAsync(599)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    notify('Pending')
    await nextTick()
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
    notify('After unmount')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps persistent notifications until dismissed', async () => {
    vi.useFakeTimers()
    const { wrapper, notify } = mountEmbedded()
    notify('Persistent', 'info', { timeout: Number.POSITIVE_INFINITY })
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    await wrapper.get('button').trigger('click')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('loads the existing renderer for ordinary integrations', async () => {
    const wrapper = mount(ScalarToasts)
    await vi.waitFor(async () => {
      await flushPromises()
      expect(wrapper.find('.scalar-toaster').exists()).toBe(true)
    })
    useToasts().toast('Ordinary notification')
    await nextTick()
    await vi.waitFor(() => expect(wrapper.text().includes('Ordinary notification')).toBe(true))
    wrapper.unmount()
  })
})
