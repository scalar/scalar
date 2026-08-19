import { describe, expect, it } from 'vitest'

import App from './App.vue'

/**
 * The facade contract test required by the chat unification plan before any
 * recomposition of this package onto @scalar/chat. agent.scalar.com and the
 * api-reference drawer consume the full public surface of the exported
 * `Chat` component — renaming or removing anything below is a breaking
 * change and must fail here first.
 */
describe('App', () => {
  it('keeps the public prop surface stable', () => {
    const props = Object.keys((App as { props?: Record<string, unknown> }).props ?? {}).sort()

    expect(props).toEqual(
      [
        'registryDocuments',
        'registryUrl',
        'dashboardUrl',
        'platformProxyUrl',
        'baseUrl',
        'mode',
        'getAccessToken',
        'getAgentKey',
        'getActiveDocumentJson',
        'isLoggedIn',
        'prefilledMessage',
        'hideAddApi',
      ].sort(),
    )
  })

  it('keeps the uploadApi emit', () => {
    const emits = (App as { emits?: string[] }).emits ?? []

    expect(emits).toContain('uploadApi')
  })
})
