import { afterEach, describe, expect, it, vi } from 'vitest'

const resetVueBundlerGlobals = (): void => {
  Reflect.deleteProperty(globalThis, '__VUE_OPTIONS_API__')
  Reflect.deleteProperty(globalThis, '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__')
  Reflect.deleteProperty(globalThis, '__VUE_PROD_DEVTOOLS__')
}

describe('ApiReferenceReact', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@scalar/api-reference')
    resetVueBundlerGlobals()
  })

  it('loads when Vue bundler flags are not pre-defined globally', async () => {
    resetVueBundlerGlobals()

    vi.doMock('@scalar/api-reference', () => {
      // Simulate Vue's production bundler macro access.
      // The module import should not throw here.
      if (__VUE_PROD_HYDRATION_MISMATCH_DETAILS__) {
        // Noop.
      }

      return {
        createApiReference: vi.fn(() => ({
          destroy: vi.fn(),
          updateConfiguration: vi.fn(),
        })),
      }
    })

    const module = await import('./ApiReferenceReact')

    expect(typeof module.ApiReferenceReact).toBe('function')
  })
})
