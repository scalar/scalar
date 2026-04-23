// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('ssr-hydration-config', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('unwraps array configuration before passing it to ApiReference in SSR', async () => {
    const app = {
      app: 'mock-app',
      config: {} as { idPrefix?: string },
      use: vi.fn(),
    }
    const createSSRApp = vi.fn(() => app)
    const h = vi.fn(() => ({ vnode: 'mock-vnode' }))
    const renderToString = vi.fn(async () => '<div>mock-html</div>')

    vi.doMock('vue', () => ({
      createSSRApp,
      h,
    }))
    vi.doMock('vue/server-renderer', () => ({
      renderToString,
    }))
    vi.doMock('@scalar/api-reference', () => ({
      ApiReference: 'MockApiReference',
    }))

    const { renderApiReferenceToString } = await import('./ssr')
    await renderApiReferenceToString([{ url: 'https://example.com/openapi.json' }])

    const firstCreateSsrCall = createSSRApp.mock.calls.at(0)
    const rootComponent = firstCreateSsrCall?.at(0) as
      | {
          setup?: () => unknown
        }
      | undefined
    expect(typeof rootComponent?.setup).toBe('function')

    const renderRoot = rootComponent?.setup?.() as (() => unknown) | undefined
    expect(typeof renderRoot).toBe('function')
    renderRoot?.()

    expect(h).toHaveBeenCalledWith('MockApiReference', {
      configuration: { url: 'https://example.com/openapi.json' },
    })
    expect(app.use).toHaveBeenCalledTimes(1)
    expect(app.config.idPrefix).toBe('scalar-refs')
  })
})
