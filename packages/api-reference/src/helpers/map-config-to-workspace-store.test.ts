import { findClient, generateClientOptions, getClients } from '@scalar/blocks/code-example'
import { apiReferenceConfigurationSchema } from '@scalar/schemas/api-reference'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { coerce } from '@scalar/validation'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, describe, expect, it } from 'vitest'
import { type Ref, effectScope, nextTick, ref } from 'vue'

import { loadClientFromStorage } from './load-from-perssistance'
import { mapConfigToWorkspaceStore } from './map-config-to-workspace-store'
import { clientStorage } from './storage'

describe('map-config-to-workspace-store', () => {
  const scopes: ReturnType<typeof effectScope>[] = []

  afterEach(() => {
    scopes.splice(0).forEach((scope) => scope.stop())
    localStorage.clear()
  })

  const setup = (
    initial: Partial<ApiReferenceConfigurationRaw>,
  ): {
    store: ReturnType<typeof createWorkspaceStore>
    config: Ref<ApiReferenceConfigurationRaw>
  } => {
    const store = createWorkspaceStore()
    const config = ref<ApiReferenceConfigurationRaw>(coerce(apiReferenceConfigurationSchema, initial))
    const scope = effectScope()
    scopes.push(scope)
    scope.run(() => mapConfigToWorkspaceStore({ config, store, isDarkMode: ref(false) }))
    return { store, config }
  }

  it('selects a custom sample from configuration', () => {
    const { store } = setup({ defaultHttpClient: { targetKey: 'custom', clientKey: 'python' } })
    const options = getClients([{ lang: 'python', source: 'client.pets.list()' }], generateClientOptions())

    expect(store.workspace['x-scalar-default-client']).toBe('custom/python')
    expect(findClient(options, store.workspace['x-scalar-default-client'])?.id).toBe('custom/python')
  })

  it('updates the custom selection when configuration changes', async () => {
    const { store, config } = setup({ defaultHttpClient: { targetKey: 'node', clientKey: 'fetch' } })
    config.value = { ...config.value, defaultHttpClient: { targetKey: 'custom', clientKey: 'python/1' } }
    await nextTick()

    expect(store.workspace['x-scalar-default-client']).toBe('custom/python/1')
  })

  it('keeps an explicit custom default ahead of a saved built-in client', () => {
    const { store } = setup({ defaultHttpClient: { targetKey: 'custom', clientKey: 'python' } })
    clientStorage().set('js/fetch')
    loadClientFromStorage(store)

    expect(store.workspace['x-scalar-default-client']).toBe('custom/python')
  })

  it('uses existing fallback behavior when an operation lacks the selected sample', () => {
    const { store } = setup({ defaultHttpClient: { targetKey: 'custom', clientKey: 'python' } })
    const clients = generateClientOptions()
    const options = getClients([{ lang: 'ruby', source: 'client.pets.list' }], clients)

    expect(findClient(options, store.workspace['x-scalar-default-client'])?.id).toBe('custom/ruby')
    expect(findClient(clients, store.workspace['x-scalar-default-client'])?.id).toBe('shell/curl')
  })

  it('continues to select built-in clients', () => {
    const { store } = setup({ defaultHttpClient: { targetKey: 'node', clientKey: 'fetch' } })
    expect(store.workspace['x-scalar-default-client']).toBe('node/fetch')
  })
})
