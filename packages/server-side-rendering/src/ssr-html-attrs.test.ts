// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('ssr-html-attrs', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('keeps lang="en" when other html attributes are present', async () => {
    const app = {
      config: {} as { idPrefix?: string },
      use: vi.fn(),
    }

    vi.doMock('vue', () => ({
      createSSRApp: () => app,
      h: vi.fn(() => ({ vnode: 'mock-vnode' })),
    }))
    vi.doMock('vue/server-renderer', () => ({
      renderToString: vi.fn(async () => '<div>mock-html</div>'),
    }))
    vi.doMock('@scalar/api-reference', () => ({
      ApiReference: 'MockApiReference',
    }))
    vi.doMock('@unhead/vue', () => ({
      useServerSeoMeta: vi.fn(),
    }))
    vi.doMock('@unhead/vue/server', () => ({
      createHead: (options?: { init?: Array<{ htmlAttrs?: { lang?: string } }> }) => ({ options }),
      renderSSRHead: (head: { options?: { init?: Array<{ htmlAttrs?: { lang?: string } }> } }) => {
        const lang = head.options?.init?.[0]?.htmlAttrs?.lang
        const langAttribute = lang ? ` lang="${lang}"` : ''

        return {
          htmlAttrs: `${langAttribute} data-testid="html-attrs"`,
          bodyAttrs: '',
          bodyTagsOpen: '',
          bodyTags: '',
          headTags: '',
        }
      },
    }))

    const { renderApiReference } = await import('./ssr')
    const html = await renderApiReference({ config: {}, css: '' })

    expect(html).toContain('<html lang="en" data-testid="html-attrs">')
  })
})
