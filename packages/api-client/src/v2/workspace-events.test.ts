import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus, navigate } from '@scalar/workspace-store/events'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { initializeWorkspaceEventHandlers } from './workspace-events'

describe('workspace-events', () => {
  it.each(['tabs:focus:tab', 'tabs:focus:tab-last', 'tabs:navigate:previous', 'tabs:navigate:next'] as const)(
    'owns and disposes the %s destination',
    async (command) => {
      const store = createWorkspaceStore()
      const eventBus = createWorkspaceEventBus()
      const changed = vi.fn()
      const options = { eventBus, store: ref(store), hooks: { [command]: { onAfterExecute: changed } } }
      const host = initializeWorkspaceEventHandlers(options)
      navigate(host.navigation, command, { index: 0 })
      await flushPromises()
      expect(changed).toHaveBeenCalledOnce()
      host()
      expect(() => navigate(host.navigation, command, { index: 0 })).toThrow('Missing primary handler')
      const replacement = initializeWorkspaceEventHandlers(options)
      navigate(replacement.navigation, command, { index: 0 })
      await flushPromises()
      expect(changed).toHaveBeenCalledTimes(2)
      replacement()
    },
  )

  it('hands subscriptions over without applying a workspace mutation twice', async () => {
    const store = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()
    const changed = vi.fn()
    const options = {
      eventBus,
      store: ref(store),
      hooks: { 'workspace:update:selected-client': { onAfterExecute: changed } },
    }
    const stop = initializeWorkspaceEventHandlers(options)

    eventBus.emit('workspace:update:selected-client', 'python/requests')
    await flushPromises()
    expect(store.workspace['x-scalar-default-client']).toBe('python/requests')
    expect(changed).toHaveBeenCalledTimes(1)

    stop()
    stop()
    eventBus.emit('workspace:update:selected-client', 'shell/curl')
    await flushPromises()
    expect(store.workspace['x-scalar-default-client']).toBe('python/requests')
    expect(changed).toHaveBeenCalledTimes(1)

    const stopModal = initializeWorkspaceEventHandlers(options)
    eventBus.emit('workspace:update:selected-client', 'shell/curl')
    await flushPromises()
    expect(store.workspace['x-scalar-default-client']).toBe('shell/curl')
    expect(changed).toHaveBeenCalledTimes(2)
    stopModal()
  })
})
