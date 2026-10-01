import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { initializeWorkspaceEventHandlers } from './workspace-events'

describe('workspace-events', () => {
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
  it.each([
    { event: 'tabs:navigate:previous', payload: undefined, expectedIndex: 0 },
    { event: 'tabs:navigate:next', payload: undefined, expectedIndex: 2 },
    { event: 'tabs:focus:tab', payload: { index: 0 }, expectedIndex: 0 },
    { event: 'tabs:focus:tab-last', payload: undefined, expectedIndex: 2 },
  ] as const)('hands over $event without duplicate mutations or hooks', async ({ event, payload, expectedIndex }) => {
    const store = createWorkspaceStore()
    store.workspace['x-scalar-tabs'] = [
      { path: '/one', title: 'One' },
      { path: '/two', title: 'Two' },
      { path: '/three', title: 'Three' },
    ]
    store.workspace['x-scalar-active-tab'] = 1
    const eventBus = createWorkspaceEventBus()
    const navigated = vi.fn()
    const options = { eventBus, store: ref(store), hooks: { [event]: { onAfterExecute: navigated } } }
    const stop = initializeWorkspaceEventHandlers(options)
    eventBus.emit(event, payload)
    await flushPromises()
    expect(store.workspace['x-scalar-active-tab']).toBe(expectedIndex)
    expect(navigated).toHaveBeenCalledTimes(1)

    stop()
    expect(() => eventBus.emit(event, payload)).toThrow('Unhandled navigation command')
    store.workspace['x-scalar-active-tab'] = 1
    const stopNext = initializeWorkspaceEventHandlers(options)
    eventBus.emit(event, payload)
    await flushPromises()
    expect(store.workspace['x-scalar-active-tab']).toBe(expectedIndex)
    expect(navigated).toHaveBeenCalledTimes(2)
    stopNext()
  })
})
