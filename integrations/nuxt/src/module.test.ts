import { beforeEach, describe, expect, it, vi } from 'vitest'

const { addComponentMock, extendPagesMock, createResolverMock, defineNuxtModuleMock } = vi.hoisted(() => ({
  addComponentMock: vi.fn(),
  extendPagesMock: vi.fn(),
  createResolverMock: vi.fn(() => ({
    resolve: (path: string) => `/resolved/${path}`,
  })),
  defineNuxtModuleMock: vi.fn((definition) => definition),
}))

vi.mock('@nuxt/kit', () => ({
  addComponent: addComponentMock,
  createResolver: createResolverMock,
  defineNuxtModule: defineNuxtModuleMock,
  extendPages: extendPagesMock,
}))

import module from './module'

type HookHandler = (config: Record<string, unknown>) => void

type NuxtMock = {
  options: {
    build: {
      transpile: string[]
    }
    imports: {
      transform?: {
        exclude?: RegExp[]
      }
    }
    vite: {
      optimizeDeps?: {
        include?: string[]
      }
      ssr?: {
        noExternal?: string[] | boolean
      }
    }
    dev: boolean
  }
  hook: ReturnType<typeof vi.fn>
}

const createNuxtMock = (): { nuxt: NuxtMock; getHook: (name: string) => HookHandler | undefined } => {
  const hooks = new Map<string, HookHandler>()
  const nuxt: NuxtMock = {
    options: {
      build: {
        transpile: [],
      },
      imports: {},
      vite: {},
      dev: false,
    },
    hook: vi.fn((name: string, handler: HookHandler) => {
      hooks.set(name, handler)
    }),
  }

  return {
    nuxt,
    getHook: (name: string) => hooks.get(name),
  }
}

describe('module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers scalar page metadata for nitro openapi mode', () => {
    const { nuxt, getHook } = createNuxtMock()
    const options = {
      configurations: [],
      darkMode: true,
      devtools: false,
      layout: false,
      pathRouting: {
        basePath: '/_scalar',
      },
    }

    module.setup(options, nuxt)

    expect(addComponentMock.mock.calls.length).toBe(1)
    expect(addComponentMock.mock.calls[0]?.[0]).toStrictEqual({
      export: 'default',
      filePath: '/resolved/./runtime/components/ScalarApiReference.vue',
      name: 'ScalarApiReference',
    })

    expect(nuxt.options.build.transpile).toStrictEqual(['yaml'])
    expect(nuxt.options.vite.optimizeDeps?.include?.includes('@scalar/nuxt > @scalar/api-reference')).toBe(true)

    const nitroConfig = { experimental: { openAPI: true } }
    getHook('nitro:config')?.(nitroConfig)
    expect(nitroConfig).toStrictEqual({
      experimental: { openAPI: true },
      openAPI: { production: 'prerender' },
    })

    expect(extendPagesMock.mock.calls.length).toBe(1)
    const extendPagesHandler = extendPagesMock.mock.calls[0]?.[0] as (pages: unknown[]) => void
    const pages: Array<Record<string, unknown>> = []
    extendPagesHandler(pages)

    expect(pages.length).toBe(1)
    expect(pages[0]?.name).toBe('scalar')
    expect(pages[0]?.path).toBe('/_scalar:pathMatch(.*)*')
    expect(pages[0]?.file).toBe('/resolved/./runtime/pages/ScalarPage.vue')
    expect((pages[0]?.meta as { isOpenApiEnabled?: boolean })?.isOpenApiEnabled).toBe(true)
  })

  it('creates one page per custom configuration', () => {
    const { nuxt } = createNuxtMock()
    const options = {
      configurations: [
        {
          pathRouting: {
            basePath: '/docs-v1',
          },
        },
        {
          pathRouting: {
            basePath: '/docs-v2',
          },
        },
      ],
      darkMode: true,
      devtools: false,
      layout: false,
      pathRouting: {
        basePath: '/docs',
      },
    }

    module.setup(options, nuxt)

    const extendPagesHandler = extendPagesMock.mock.calls[0]?.[0] as (pages: unknown[]) => void
    const pages: Array<Record<string, unknown>> = []
    extendPagesHandler(pages)

    expect(pages.length).toBe(2)
    expect(pages[0]?.name).toBe('scalar-0')
    expect(pages[0]?.path).toBe('/docs-v1:pathMatch(.*)*')
    expect(pages[1]?.name).toBe('scalar-1')
    expect(pages[1]?.path).toBe('/docs-v2:pathMatch(.*)*')
  })
})
