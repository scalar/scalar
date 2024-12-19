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

  it('returns store and add functions', () => {
    const result = createStore({ url: 'https://example.com/openapi.json' })
    expect(result).toHaveProperty('store')
    expect(result).toHaveProperty('addUrl')
    expect(typeof result.addUrl).toBe('function')
    expect(result).toHaveProperty('addContent')
    expect(typeof result.addContent).toBe('function')
  })

  it('accepts content directly', async () => {
    const content = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })

    const result = createStore({ content })
    expect(result).toHaveProperty('store')
    expect(result).toHaveProperty('addContent')
    expect(typeof result.addContent).toBe('function')

    // TODO: Use a hook or something to wait for the store to be ready
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(Object.values(result.store.collections)[0]?.info?.title).toBe(
      'Test API',
    )
  })
})
