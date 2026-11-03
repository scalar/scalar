import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { type PluginManager, createPluginManager } from '@/plugins/plugin-manager'

import { PLUGIN_MANAGER_SYMBOL, usePluginManager } from './usePluginManager'

vi.unmock('@/plugins/hooks/usePluginManager')

describe('usePluginManager', () => {
  const mountConsumer = (manager?: PluginManager): PluginManager => {
    const wrapper = mount(
      defineComponent({
        setup: () => ({ manager: usePluginManager() }),
        template: '<div />',
      }),
      { global: { provide: manager ? { [PLUGIN_MANAGER_SYMBOL]: manager } : {} } },
    )
    const result = wrapper.vm.manager
    wrapper.unmount()
    return result
  }

  it('shares an empty fallback across standalone consumers', () => {
    const first = mountConsumer()
    const second = mountConsumer()

    expect(first).toBe(second)
    expect(first.getSpecificationExtensions('x-owner')).toStrictEqual([])
    expect(first.getAuthState().export()).toStrictEqual({})
  })

  it('keeps provided managers isolated from each other and the fallback', () => {
    const first = createPluginManager({})
    const second = createPluginManager({})
    const fallback = mountConsumer()

    expect(mountConsumer(first)).toBe(first)
    expect(mountConsumer(second)).toBe(second)
    expect(first).not.toBe(second)
    expect(first).not.toBe(fallback)
    expect(mountConsumer()).toBe(fallback)
  })
})
