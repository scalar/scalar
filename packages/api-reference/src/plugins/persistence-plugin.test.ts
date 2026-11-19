import { REFERENCE_LS_KEYS } from '@scalar/helpers/object/local-storage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { persistencePlugin } from './persistence-plugin'

const AUTH_KEY = (slug: string) => `${REFERENCE_LS_KEYS.AUTH}-${slug}`

describe('persistence-plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it.each([undefined, true])('persists the selected client when the option is %s', async (persistSelectedClient) => {
    const plugin = persistencePlugin({ persistSelectedClient, debounceDelay: 100 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'meta',
      value: { 'x-scalar-default-client': 'js/fetch' },
    })
    await vi.runAllTimersAsync()

    expect(localStorage.getItem(REFERENCE_LS_KEYS.SELECTED_CLIENT)).toBe('js/fetch')
  })

  it('leaves the saved client untouched while persisting auth independently', async () => {
    localStorage.setItem(REFERENCE_LS_KEYS.SELECTED_CLIENT, 'shell/curl')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const plugin = persistencePlugin({ persistSelectedClient: false, persistAuth: true, debounceDelay: 100 })
    const auth = { secrets: {}, selected: { document: undefined, path: undefined } }

    plugin.hooks?.onWorkspaceStateChanges?.({ type: 'meta', value: { 'x-scalar-default-client': 'js/fetch' } })
    plugin.hooks?.onWorkspaceStateChanges?.({ type: 'auth', documentName: 'doc-a', value: auth })
    await vi.runAllTimersAsync()

    expect(setItem.mock.calls).toStrictEqual([[AUTH_KEY('doc-a'), JSON.stringify(auth)]])
    expect(localStorage.getItem(REFERENCE_LS_KEYS.SELECTED_CLIENT)).toBe('shell/curl')
    setItem.mockRestore()
  })

  it('rechecks reactive persistence before a queued write and permits later selections when enabled', async () => {
    const configuration = { persistSelectedClient: true }
    const plugin = persistencePlugin({
      persistSelectedClient: () => configuration.persistSelectedClient,
      debounceDelay: 100,
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    plugin.hooks?.onWorkspaceStateChanges?.({ type: 'meta', value: { 'x-scalar-default-client': 'js/fetch' } })
    configuration.persistSelectedClient = false
    await vi.runAllTimersAsync()
    expect(setItem).not.toHaveBeenCalled()

    configuration.persistSelectedClient = true
    plugin.hooks?.onWorkspaceStateChanges?.({ type: 'meta', value: { 'x-scalar-default-client': 'php/guzzle' } })
    await vi.runAllTimersAsync()
    expect(setItem.mock.calls).toStrictEqual([[REFERENCE_LS_KEYS.SELECTED_CLIENT, 'php/guzzle']])
    setItem.mockRestore()
  })

  it('persists auth changes to the correct document slug from the event', async () => {
    const plugin = persistencePlugin({ persistAuth: true, debounceDelay: 0 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: {
          oauth: {
            type: 'oauth2',
            implicit: {
              'x-scalar-secret-redirect-uri': 'https://a.example.com/callback',
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-token': '',
            },
          },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    await vi.runAllTimersAsync()

    const saved = JSON.parse(localStorage.getItem(AUTH_KEY('doc-a')) ?? '{}')
    expect(saved.secrets?.oauth?.implicit?.['x-scalar-secret-redirect-uri']).toBe('https://a.example.com/callback')
  })

  it('keeps auth for each document isolated when both fire changes before debounce flushes', async () => {
    const plugin = persistencePlugin({ persistAuth: true, debounceDelay: 100 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: {
          oauth: {
            type: 'oauth2',
            implicit: {
              'x-scalar-secret-redirect-uri': 'https://a.example.com/callback',
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-token': '',
            },
          },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-b',
      value: {
        secrets: {
          oauth: {
            type: 'oauth2',
            implicit: {
              'x-scalar-secret-redirect-uri': 'https://b.example.com/callback',
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-token': '',
            },
          },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    await vi.runAllTimersAsync()

    const savedA = JSON.parse(localStorage.getItem(AUTH_KEY('doc-a')) ?? '{}')
    const savedB = JSON.parse(localStorage.getItem(AUTH_KEY('doc-b')) ?? '{}')

    // Both documents must be persisted independently — the second event must NOT
    // replace the pending write for the first.
    expect(savedA.secrets?.oauth?.implicit?.['x-scalar-secret-redirect-uri']).toBe('https://a.example.com/callback')
    expect(savedB.secrets?.oauth?.implicit?.['x-scalar-secret-redirect-uri']).toBe('https://b.example.com/callback')
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

    expect(localStorage.getItem(AUTH_KEY('doc-a'))).toBeNull()
  })

  it('persists the latest auth value when the same document fires multiple rapid changes', async () => {
    const plugin = persistencePlugin({ persistAuth: true, debounceDelay: 100 })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: {
          oauth: {
            type: 'oauth2',
            implicit: {
              'x-scalar-secret-redirect-uri': 'https://first.example.com',
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-token': '',
            },
          },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    plugin.hooks?.onWorkspaceStateChanges?.({
      type: 'auth',
      documentName: 'doc-a',
      value: {
        secrets: {
          oauth: {
            type: 'oauth2',
            implicit: {
              'x-scalar-secret-redirect-uri': 'https://latest.example.com',
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-token': '',
            },
          },
        },
        selected: { document: undefined, path: undefined },
      },
    })

    await vi.runAllTimersAsync()

    const saved = JSON.parse(localStorage.getItem(AUTH_KEY('doc-a')) ?? '{}')
    expect(saved.secrets?.oauth?.implicit?.['x-scalar-secret-redirect-uri']).toBe('https://latest.example.com')
  })
})
