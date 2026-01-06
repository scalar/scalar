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
const locationMock = {
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
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.unstubAllGlobals()

  /** Mock window.location for all tests */
  vi.stubGlobal('location', locationMock)

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
    description: '# Heading 1\nContent 1\n# Heading 2\nContent 2',
  },
  paths: {
    '/users': {
      get: {
        summary: 'Get users',
        operationId: 'getUsers',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperImportantUser',
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SuperImportantUser: {
        type: 'object',
        required: ['isAdmin', 'phone'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          isAdmin: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zip: { type: 'string' },
            },
          },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
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

    const items = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    expect(items[2]?.text().startsWith('/users')).toBe(true)
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

  it('orderSchemaPropertiesBy: undefined -> alpha', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })
    await flushPromises()

    const propertyNames = wrapper
      .findComponent({ name: 'RequestBody' })
      .findAll('.property-name')
      .map((item) => item.text().split(' ')[0]?.replace('Copy', ''))

    expect(propertyNames).toStrictEqual([
      'isAdmin',
      'phone',
      'address',
      'age',
      'createdAt',
      'email',
      'name',
      'updatedAt',
    ])
  })

  it('orderSchemaPropertiesBy: undefined -> alpha, orderRequiredPropertiesFirst: false', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          orderRequiredPropertiesFirst: false,
        },
      },
    })
    await flushPromises()

    const propertyNames = wrapper
      .findComponent({ name: 'RequestBody' })
      .findAll('.property-name')
      .map((item) => item.text().split(' ')[0]?.replace('Copy', ''))

    expect(propertyNames).toStrictEqual([
      'address',
      'age',
      'createdAt',
      'email',
      'isAdmin',
      'name',
      'phone',
      'updatedAt',
    ])
  })

  it('orderSchemaPropertiesBy: preserve, orderRequiredPropertiesFirst: false', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          orderSchemaPropertiesBy: 'preserve',
          orderRequiredPropertiesFirst: false,
        },
      },
    })
    await flushPromises()

    const propertyNames = wrapper
      .findComponent({ name: 'RequestBody' })
      .findAll('.property-name')
      .map((item) => item.text().split(' ')[0])

    expect(propertyNames).toStrictEqual([
      'nameCopy',
      'ageCopy',
      'isAdminCopy',
      'createdAtCopy',
      'updatedAtCopy',
      'addressCopy',
      'phoneCopy',
      'emailCopy',
    ])
  })

  it('orderRequiredPropertiesFirst: undefined -> true', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
        },
      },
    })
    await flushPromises()

    const propertyNames = wrapper
      .findComponent({ name: 'RequestBody' })
      .findAll('.property-name')
      .map((item) => item.text().split(' ')[0])

    expect(propertyNames).toStrictEqual([
      'isAdminCopy',
      'phoneCopy',
      'addressCopy',
      'ageCopy',
      'createdAtCopy',
      'emailCopy',
      'nameCopy',
      'updatedAtCopy',
    ])
  })

  it('orderRequiredPropertiesFirst: false', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          orderRequiredPropertiesFirst: false,
        },
      },
    })
    await flushPromises()

    const propertyNames = wrapper
      .findComponent({ name: 'RequestBody' })
      .findAll('.property-name')
      .map((item) => item.text().split(' ')[0])

    expect(propertyNames).toStrictEqual([
      'addressCopy',
      'ageCopy',
      'createdAtCopy',
      'emailCopy',
      'isAdminCopy',
      'nameCopy',
      'phoneCopy',
      'updatedAtCopy',
    ])
  })

  it('generateHeadingSlug: function', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          generateHeadingSlug: (heading: { slug: string }) => `custom-test-slug-${heading.slug}`,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'InfoDescription' }).find('h1').html()).toContain('custom-test-slug-heading-1')
  })

  it('generateOperationSlug: function', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          generateOperationSlug: (operation: { method: string; path: string }) =>
            `custom-test-slug-${operation.method}-${operation.path}`,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'Operation' }).find('section').html()).toContain('custom-test-slug-GET-/users')
  })

  it('redirect: function', async () => {
    vi.stubGlobal('location', { ...locationMock, hash: '#old' })
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          redirect: (hash: string) => hash.replace('#old', '#new'),
        },
      },
    })

    await flushPromises()
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '#new')
  })

  it('defaultHttpClient: { targetKey: "node", clientKey: "axios" }', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          defaultHttpClient: {
            targetKey: 'node',
            clientKey: 'axios',
          },
        },
      },
    })
    await flushPromises()

    expect(wrapper.vm.workspaceStore.workspace['x-scalar-default-client']).toBe('node/axios')
  })

  it('hiddenClients: ["unirest", "node"]', async () => {
    const wrapper = mountComponent({
      props: {
        configuration: {
          content: createBasicDocument(),
          hiddenClients: ['unirest', 'node'],
        },
      },
    })

    await flushPromises()
    const httpClientsSet = new Set(wrapper.findComponent({ name: 'Content' }).props().httpClients)
    expect(httpClientsSet).not.toContain('node/axios')
    expect(httpClientsSet).not.toContain('java/unirest')
    expect(httpClientsSet).toContain('js/axios')
    expect(httpClientsSet).toContain('java/nethttp')
  })
})
