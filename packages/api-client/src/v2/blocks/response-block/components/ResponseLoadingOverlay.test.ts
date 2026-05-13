import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ResponseLoadingOverlay from './ResponseLoadingOverlay.vue'

describe('ResponseLoadingOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not leave loading controls visible when overlapping sent events finish before the delayed start', async () => {
    const eventBus = createWorkspaceEventBus()
    const meta = {
      method: 'get' as const,
      path: '/api',
      exampleKey: 'example',
    }

    const wrapper = mount(ResponseLoadingOverlay, {
      props: { eventBus },
      global: {
        stubs: {
          Transition: { template: '<div><slot /></div>' },
          ScalarLoading: { template: '<span />' },
        },
      },
    })

    await flushPromises()

    eventBus.emit('hooks:on:request:sent', { meta })
    eventBus.emit('hooks:on:request:sent', { meta })
    eventBus.emit('hooks:on:request:complete', { payload: undefined, meta })

    await vi.advanceTimersByTimeAsync(300)

    expect(wrapper.findAll('button').length).toBe(0)

    await vi.advanceTimersByTimeAsync(700)

    expect(wrapper.findAll('button').length).toBe(0)
  })
})
