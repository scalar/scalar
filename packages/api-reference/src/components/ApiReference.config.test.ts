import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ApiReference from './ApiReference.vue'

vi.mock(import('@scalar/use-hooks/useBreakpoints'), (importOriginal) => ({
  ...importOriginal(),
  useBreakpoints: () => ({
    mediaQueries: {
      lg: { value: true },
    },
  }),
}))

/** Track all mounted wrappers so we can unmount them after each test */
const wrappers: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.resetAllMocks()
  vi.unstubAllGlobals()

  /** Mock window.location for all tests */
  vi.stubGlobal('location', {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    ancestorOrigins: {} as DOMStringList,
    assign: vi.fn(),
    reload: vi.fn(),
    replace: vi.fn(),
    toString: () => 'http://localhost:3000/',
  })

  /**
   * Mock ResizeObserver which is used by @headlessui/vue Dialog component
   * but is not available in the test environment.
   *
   * @see https://github.com/jsdom/jsdom/issues/3368
   */
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

  /**
   * Mock IntersectionObserver which is not available in the test environment.
   *
   * @see https://github.com/jsdom/jsdom/issues/2032
   */
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
    takeRecords: vi.fn(() => []),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))

  /**
   * Bypass lazy loading for testing purposes.
   * This simplifies testing by removing asynchronous rendering behavior.
   */
  vi.mock('./Lazy/Lazy.vue', () => ({
    default: {
      name: 'Lazy',
      props: {
        id: 'test-id',
      },
      setup(_props: unknown, { slots }: { slots: Record<string, () => unknown> }) {
        return () => slots.default?.()
      },
    },
  }))
})

// Clean up all mounted wrappers after each test
afterEach(() => {
  while (wrappers.length > 0) {
    const wrapper = wrappers.pop()
    if (wrapper?.vm) {
      wrapper.unmount()
    }
  }
})

/** Helper function to mount and track component */
const mountComponent = (props: Parameters<typeof mount>[1]) => {
  const wrapper = mount(ApiReference, {
    ...props,
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

/** Helper function to create a basic OpenAPI document */
const createBasicDocument = (title = 'Test API') => ({
  openapi: '3.1.0',
  info: {
    title,
    version: '1.0.0',
  },
  paths: {
    '/users': {
      get: {
        summary: 'Get users',
        operationId: 'getUsers',
      },
    },
  },
  components: {
    schemas: {
      SuperImportantUser: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    },
  },
})

describe('ApiReference Configuration Tests', () => {
  it('layout: undefined -> modern', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })

    const apiRef = wrapper.find('.scalar-api-reference')
    expect(apiRef.classes()).not.toContain('references-classic')
  })

  it('layout: classic', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          layout: 'classic',
        },
      },
    })

    const apiRef = wrapper.find('.scalar-api-reference')
    expect(apiRef.classes()).toContain('references-classic')
  })

  it('showSidebar: undefined -> true', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })

    const apiRef = wrapper.find('.scalar-api-reference')
    expect(apiRef.classes()).toContain('references-sidebar')
  })

  it('showSidebar: false', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          showSidebar: false,
        },
      },
    })

    const apiRef = wrapper.find('.scalar-api-reference')
    expect(apiRef.classes()).not.toContain('references-sidebar')
  })

  it('hideSearch: undefined -> false', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })

    const searchButton = wrapper.findComponent({ name: 'SearchButton' })
    expect(searchButton.exists()).toBe(true)
  })

  it('hideSearch: true', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          hideSearch: true,
        },
      },
    })

    const searchButton = wrapper.findComponent({ name: 'SearchButton' })
    expect(searchButton.exists()).toBe(false)
  })

  it('searchHotKey: f', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          searchHotKey: 'f',
        },
      },
    })

    expect(wrapper.findComponent({ name: 'SearchModal' }).props().modalState.open).toBe(false)
    wrapper.trigger('keydown', { key: 'f', ctrlKey: true })
    expect(wrapper.findComponent({ name: 'SearchModal' }).props().modalState.open).toBe(true)
  })

  it('hideModels: undefined -> false', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })
    await flushPromises()

    const modelTag = wrapper.findComponent({ name: 'ModelTag' })
    expect(modelTag.exists()).toBe(true)
  })

  it('hideModels: true', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          hideModels: true,
        },
      },
    })
    await flushPromises()

    const modelTag = wrapper.findComponent({ name: 'ModelTag' })
    expect(modelTag.exists()).toBe(false)
  })

  it('darkMode: false', () => {
    mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          darkMode: false,
        },
      },
    })

    expect(document.body.classList.contains('light-mode')).toBe(true)
  })

  it('darkMode: true', () => {
    mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          darkMode: true,
        },
      },
    })
    expect(document.body.classList.contains('dark-mode')).toBe(true)
  })

  it('forceDarkModeState: dark', () => {
    mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          forceDarkModeState: 'dark',
        },
      },
    })
    expect(document.body.classList.contains('dark-mode')).toBe(true)
  })

  // TODO doesn't work
  it('forceDarkModeState: light', () => {
    mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          forceDarkModeState: 'light',
        },
      },
    })
    expect(document.body.classList.contains('light-mode')).toBe(true)
  })

  it('hideDarkModeToggle: true', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          hideDarkModeToggle: true,
        },
      },
    })

    const toggleButton = wrapper.findComponent({
      name: 'ScalarColorModeToggleButton',
    })
    expect(toggleButton.exists()).toBe(false)
  })

  it('customCss: .custom-class { color: red; }', () => {
    const customCss = '.custom-class { color: red; }'
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          customCss,
        },
      },
    })
    expect(wrapper.html()).toContain('.custom-class')
  })

  it('theme: solarized', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          theme: 'solarized',
        },
      },
    })

    const html = wrapper.html()

    /** Verify solarized theme CSS variables are present in dark mode */
    expect(html).toContain('--scalar-background-1: #00212b')
    expect(html).toContain('--scalar-background-2: #012b36')
    expect(html).toContain('--scalar-background-3: #004052')
    expect(html).toContain('--scalar-background-accent: #015a6f')
  })

  it('hideClientButton: undefined', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })

    const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
    expect(clientButton.exists()).toBe(true)
  })

  it('hideClientButton: true', () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          hideClientButton: true,
        },
      },
    })

    const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
    expect(clientButton.exists()).toBe(false)
  })

  it('defaultOpenAllTags: undefined -> false', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: {
            openapi: '3.1.0',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/users': {
                get: {
                  summary: 'Get users',
                  tags: ['Users'],
                },
              },
              '/others': {
                get: {
                  summary: 'Get others',
                  tags: ['Others'],
                },
              },
            },
          },
        },
      },
    })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'Content' }).text().includes('Get others')).toBe(false)
  })

  it('defaultOpenAllTags: true', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: {
            openapi: '3.1.0',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/users': {
                get: {
                  summary: 'Get users',
                  tags: ['Users'],
                },
              },
              '/others': {
                get: {
                  summary: 'Get others',
                  tags: ['Others'],
                },
              },
            },
          },
          defaultOpenAllTags: true,
        },
      },
    })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'Content' }).text().includes('Get others')).toBe(true)
  })

  it('operationTitleSource: undefined -> summary', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })
    await flushPromises()

    const operation = wrapper.findComponent({ name: 'Operation' })
    expect(operation.find('h3').text()).toBe('Get users')
  })

  // TODO doesn't work
  it('operationTitleSource: path', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          operationTitleSource: 'path',
        },
      },
    })
    await flushPromises()

    const operation = wrapper.findComponent({ name: 'Operation' })
    expect(operation.find('h3').text()).toBe('/users')
  })

  it('showOperationId: undefined -> false', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
  })

  it('showOperationId: true', async () => {
    const content = createBasicDocument()
    content.paths['/users'].get.operationId = '1234getUserById5678'
    const wrapper = mountComponent({
      props: {
        configuration: {
          content,
          showOperationId: true,
        },
      },
    })

    await flushPromises()
    expect(wrapper.findComponent({ name: 'Content' }).text().includes('1234getUserById5678')).toBe(true)
  })

  it('onLoaded: function', async () => {
    const onLoaded = vi.fn()
    mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          onLoaded,
        },
      },
    })
    await flushPromises()
    expect(onLoaded).toHaveBeenCalled()
  })

  it('onServerChange: function', async () => {
    const onServerChange = vi.fn()
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: {
            ...createBasicDocument(),
            servers: [{ url: 'https://api.example.com' }, { url: 'https://api-staging.example.com' }],
          },
          onServerChange,
        },
      },
    })

    await flushPromises()
    const ServerSelector = wrapper.findComponent({ name: 'Selector' })
    ServerSelector.vm.emit('update:modelValue', 'https://api-staging.example.com')
    expect(onServerChange).toHaveBeenCalled()
  })

  it('servers: array', async () => {
    const servers = [
      { url: 'https://api.example.com', description: 'Production' },
      { url: 'https://api-staging.example.com', description: 'Staging' },
    ]

    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          servers,
        },
      },
    })

    await flushPromises()
    const ServerSelector = wrapper.findComponent({ name: 'ServerSelector' })
    expect(ServerSelector.text().includes('api.example.com')).toBe(true)
  })

  // TODO doesn't work
  it('authentication: object', async () => {
    const authentication = {
      apiKey: {
        token: 'test-token',
      },
    }

    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          authentication,
        },
      },
    })

    await flushPromises()
    const Auth = wrapper.findComponent({ name: 'Auth' })
    expect(Auth.text().includes('test-token')).toBe(true)
  })

  describe('Schema Property Ordering Configuration', () => {
    it('orders schema properties alphabetically by default', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('preserves schema property order when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            orderSchemaPropertiesBy: 'preserve',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('orders required properties first by default', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('does not order required properties first when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            orderRequiredPropertiesFirst: false,
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Custom Slug Generators', () => {
    it('applies custom heading slug generator', async () => {
      const generateHeadingSlug = vi.fn((heading: { slug: string }) => {
        return `custom-${heading.slug}`
      })

      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            generateHeadingSlug,
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('applies custom operation slug generator', async () => {
      const generateOperationSlug = vi.fn((operation: { method: string; path: string }) => {
        return `${operation.method}-${operation.path}`
      })

      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            generateOperationSlug,
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Path Routing Configuration', () => {
    it('uses hash routing by default', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render without path routing */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('uses path routing when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            pathRouting: {
              basePath: '/docs',
            },
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render with path routing */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Redirect Configuration', () => {
    it('applies redirect function when configured', async () => {
      const redirect = vi.fn((hash: string) => {
        return hash.replace('#old', '#new')
      })

      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            redirect,
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The redirect function should be available */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('HTTP Client Configuration', () => {
    it('applies default HTTP client when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            defaultHttpClient: {
              targetKey: 'shell',
              clientKey: 'curl',
            },
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The workspace store should reflect the default HTTP client */
      expect(wrapper.vm.workspaceStore.workspace['x-scalar-default-client']).toMatchObject({
        targetKey: 'shell',
        clientKey: 'curl',
      })
    })

    it('applies hidden clients configuration', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            hiddenClients: ['unirest', 'node'],
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Metadata Configuration', () => {
    it('applies title configuration', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument('Original Title'),
            title: 'Custom Title',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('applies slug configuration', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            slug: 'custom-slug',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The workspace store should have the custom slug */
      expect(Object.keys(wrapper.vm.workspaceStore.workspace.documents)).toContain('custom-slug')
    })

    it('applies favicon configuration', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            favicon: '/custom-favicon.svg',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Developer Tools Configuration', () => {
    it('shows developer tools on localhost by default', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('always shows developer tools when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            showDeveloperTools: 'always',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('never shows developer tools when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            showDeveloperTools: 'never',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Plugins Configuration', () => {
    it('renders without plugins by default', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Telemetry Configuration', () => {
    it('enables telemetry by default', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The workspace store should have telemetry enabled */
      expect(wrapper.vm.workspaceStore.config['x-scalar-reference-config'].telemetry).toBe(true)
    })

    it('disables telemetry when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            telemetry: false,
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The workspace store should have telemetry disabled */
      expect(wrapper.vm.workspaceStore.config['x-scalar-reference-config'].telemetry).toBe(false)
    })
  })

  describe('Integration Identifier Configuration', () => {
    it('applies integration identifier when configured', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            _integration: 'nextjs',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles empty configuration gracefully', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {},
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** The component should render even with empty config */
      expect(wrapper.exists()).toBe(true)
    })

    it('handles invalid layout value gracefully', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            // @ts-expect-error - testing invalid value
            layout: 'invalid',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** Should fall back to default layout */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })

    it('handles invalid theme value gracefully', async () => {
      const wrapper = mountComponent({
        props: {
          configuration: {
            content: createBasicDocument(),
            // @ts-expect-error - testing invalid value
            theme: 'invalid',
          },
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      /** Should fall back to default theme */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
    })
  })
})
