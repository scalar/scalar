import { describe, expect, it } from 'vitest'

import { createStore } from './createStore'

describe('createStore', () => {
  it('creates a store with default settings', () => {
    const { store } = createStore({ url: 'https://example.com/openapi.json' })
    expect(store).toBeDefined()
    expect(Object.keys(store.workspaces)).toHaveLength(1)
    expect(Object.values(store.workspaces)[0]?.uid).toBe('default')
  })

  it('creates workspace with correct configuration', () => {
    const { store } = createStore({ url: 'https://example.com/openapi.json' })
    const workspace = Object.values(store.workspaces)[0]

    expect(workspace).toEqual(
      expect.objectContaining({
        uid: 'default',
        name: 'Workspace',
        proxyUrl: 'https://proxy.scalar.com',
      }),
    )
  })

  it('returns store and add function', () => {
    const result = createStore({ url: 'https://example.com/openapi.json' })
    expect(result).toHaveProperty('store')
    expect(result).toHaveProperty('add')
    expect(typeof result.add).toBe('function')
  })
})
