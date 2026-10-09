import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { initializeWorkspaceEventHandlers } from './workspace-events'

describe('workspace-events', () => {
  it.each([false, true])('persists API key name edits with configuration enabled: %s', async (configured) => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'api',
      document: {
        openapi: '3.1.0',
        info: { title: 'Keys', version: '1.0.0' },
        paths: {},
        components: { securitySchemes: { key: { type: 'apiKey', in: 'header', name: 'X-Key' } } },
      },
    })
    const configuredSchemes = ref<AuthenticationConfiguration['securitySchemes']>(
      configured ? { key: { type: 'apiKey', in: 'header', name: 'X-Configured' } } : {},
    )
    const eventBus = createWorkspaceEventBus()
    const stop = initializeWorkspaceEventHandlers({
      eventBus,
      store: ref(store),
      hooks: {},
      getConfiguredSecuritySchemes: () => configuredSchemes.value,
    })
    store.auth.setAuthSecrets('api', 'key', { type: 'apiKey', 'x-scalar-secret-token': 'secret' })
    eventBus.emit('auth:update:security-scheme', { name: 'key', payload: { type: 'apiKey', name: '' } })
    await flushPromises()
    await store.saveDocument('api')
    const exported = JSON.parse(store.exportDocument('api', 'json') ?? '{}')
    expect(exported.components.securitySchemes.key.name).toBe(configured ? 'X-Key' : '')
    // Document-backed edits leave the secrets untouched; configured edits store the override.
    expect(store.auth.getAuthSecrets('api', 'key')).toStrictEqual({
      type: 'apiKey',
      ...(configured ? { name: '' } : {}),
      'x-scalar-secret-token': 'secret',
    })

    // Event handlers must read current configuration rather than capture initial defaults.
    configuredSchemes.value = { key: { type: 'apiKey', in: 'header', name: 'X-New-Default' } }
    eventBus.emit('auth:update:security-scheme', { name: 'key', payload: { type: 'apiKey', name: 'X-New-Default' } })
    await flushPromises()
    expect(store.auth.getAuthSecrets('api', 'key')).toStrictEqual({
      type: 'apiKey',
      name: undefined,
      'x-scalar-secret-token': 'secret',
    })
    stop()
  })

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
