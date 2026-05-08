import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { persistencePlugin } from './persistance-plugin'

const AUTH_KEY = (slug: string) => `${REFERENCE_LS_KEYS.AUTH}-${slug}`
const storage = safeLocalStorage()

describe('persistance-plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    storage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists auth changes to the correct document slug from the event', async () => {
    const plugin = persistencePlugin({ persistAuth: true, debounceDelay: 0 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: {
          oauth: { type: 'oauth2', flows: {}, 'x-scalar-secret-redirect-uri': 'https://a.example.com/callback' },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    await vi.runAllTimersAsync()

    const saved = JSON.parse(storage.getItem(AUTH_KEY('doc-a')) ?? '{}')
    expect(saved.secrets?.oauth?.['x-scalar-secret-redirect-uri']).toBe('https://a.example.com/callback')
  })

  it('keeps auth for each document isolated when both fire changes before debounce flushes', async () => {
    const plugin = persistencePlugin({ persistAuth: true, debounceDelay: 100 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: {
          oauth: { type: 'oauth2', flows: {}, 'x-scalar-secret-redirect-uri': 'https://a.example.com/callback' },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-b',
      value: {
        secrets: {
          oauth: { type: 'oauth2', flows: {}, 'x-scalar-secret-redirect-uri': 'https://b.example.com/callback' },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    await vi.runAllTimersAsync()

    const savedA = JSON.parse(storage.getItem(AUTH_KEY('doc-a')) ?? '{}')
    const savedB = JSON.parse(storage.getItem(AUTH_KEY('doc-b')) ?? '{}')

    // Both documents must be persisted independently — the second event must NOT
    // replace the pending write for the first.
    expect(savedA.secrets?.oauth?.['x-scalar-secret-redirect-uri']).toBe('https://a.example.com/callback')
    expect(savedB.secrets?.oauth?.['x-scalar-secret-redirect-uri']).toBe('https://b.example.com/callback')
  })

  it('does not persist auth when persistAuth is false', async () => {
    const plugin = persistencePlugin({ persistAuth: false, debounceDelay: 0 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: {},
        selected: { document: undefined, path: undefined },
      },
    })

    await vi.runAllTimersAsync()

    expect(storage.getItem(AUTH_KEY('doc-a'))).toBeNull()
  })

  it('persists the latest auth value when the same document fires multiple rapid changes', async () => {
    const plugin = persistencePlugin({ persistAuth: true, debounceDelay: 100 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: { oauth: { type: 'oauth2', flows: {}, 'x-scalar-secret-redirect-uri': 'https://first.example.com' } },
        selected: { document: undefined, path: undefined },
      },
    })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: { oauth: { type: 'oauth2', flows: {}, 'x-scalar-secret-redirect-uri': 'https://latest.example.com' } },
        selected: { document: undefined, path: undefined },
      },
    })

    await vi.runAllTimersAsync()

    const saved = JSON.parse(storage.getItem(AUTH_KEY('doc-a')) ?? '{}')
    expect(saved.secrets?.oauth?.['x-scalar-secret-redirect-uri']).toBe('https://latest.example.com')
  })
})
