import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
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
  globalThis.ResizeObserver = class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  }

  /**
   * Mock IntersectionObserver which is not available in the test environment.
   *
   * @see https://github.com/jsdom/jsdom/issues/2032
   */
  globalThis.IntersectionObserver = class {
    constructor(public callback: IntersectionObserverCallback) {}
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = [] as number[]
  }

  /**
   * Mock scrollIntoView which is not available in the test environment.
   *
   * @see https://github.com/jsdom/jsdom/issues/1695
   */
  Element.prototype.scrollIntoView = vi.fn()

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
  it('default configuration values', async () => {
    const wrapper = mountComponent({ props: { configuration: { content: createBasicDocument() } } })
    await flushPromises()

    const apiRef = wrapper.find('.scalar-api-reference')
    const searchButton = wrapper.findComponent({ name: 'SearchButton' })
    const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
    const testRequestButton = wrapper.findComponent({ name: 'TestRequestButton' })
    const modelTag = wrapper.findComponent({ name: 'ModelTag' })
    const operation = wrapper.findComponent({ name: 'Operation' })

    // layout: undefined -> modern
    expect(apiRef.classes()).not.toContain('references-classic')

    // showSidebar: undefined -> true
    expect(apiRef.classes()).toContain('references-sidebar')

    // hideSearch: undefined -> false
    expect(searchButton.exists()).toBe(true)

    // hideClientButton: undefined -> true
    expect(clientButton.exists()).toBe(true)

    // defaultOpenAllTags: undefined -> false
    expect(wrapper.findComponent({ name: 'Content' }).text().includes('Get others')).toBe(false)

    // operationTitleSource: undefined -> summary
    expect(operation.find('h3').text()).toBe('Get users')

    // showOperationId: undefined -> false
    expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)

    // orderSchemaPropertiesBy: undefined -> alpha
    // orderRequiredPropertiesFirst: undefined -> true
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

    // hideTestRequestButton: undefined -> false
    expect(testRequestButton.exists()).toBe(true)

    // expandAllModelSections: undefined -> false
    expect(modelTag.text().includes('Show More')).toBe(true)
    expect(modelTag.text().includes('SuperImportantUser')).toBe(false)
  })

  it('all boolean and simple configurations', async () => {
    const customCss = '.custom-class { color: red; }'
    const content = {
      ...createBasicDocument(),
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            operationId: '1234getUserById5678',
            tags: ['Users'],
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
        '/others': {
          get: {
            summary: 'Get others',
            tags: ['Others'],
          },
        },
      },
    }

    const wrapper = mountComponent({
      props: {
        configuration: {
          content,
          layout: 'classic',
          showSidebar: false,
          hideSearch: true,
          hideModels: true,
          hideDarkModeToggle: true,
          hideClientButton: true,
          hideTestRequestButton: true,
          darkMode: true,
          customCss,
          theme: 'solarized',
          defaultOpenAllTags: true,
          showOperationId: true,
          documentDownloadType: 'json',
        },
      },
    })
    await flushPromises()

    const apiRef = wrapper.find('.scalar-api-reference')
    const searchButton = wrapper.findComponent({ name: 'SearchButton' })
    const modelTag = wrapper.findComponent({ name: 'ModelTag' })
    const toggleButton = wrapper.findComponent({ name: 'ScalarColorModeToggleButton' })
    const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
    const testRequestButton = wrapper.findComponent({ name: 'TestRequestButton' })

    // layout: classic
    expect(apiRef.classes()).toContain('references-classic')

    // showSidebar: false
    expect(apiRef.classes()).not.toContain('references-sidebar')

    // hideSearch: true
    expect(searchButton.exists()).toBe(false)

    // hideModels: true
    expect(modelTag.exists()).toBe(false)

    // hideDarkModeToggle: true
    expect(toggleButton.exists()).toBe(false)

    // hideClientButton: true
    expect(clientButton.exists()).toBe(false)

    // hideTestRequestButton: true
    expect(testRequestButton.exists()).toBe(false)

    // darkMode: true
    expect(document.body.classList.contains('dark-mode')).toBe(true)

    // customCss
    expect(wrapper.html()).toContain('.custom-class')

    // theme: solarized
    const html = wrapper.html()
    expect(html).toContain('--scalar-background-1: #00212b')

    // defaultOpenAllTags: true
    expect(wrapper.findComponent({ name: 'Content' }).text().includes('Get others')).toBe(true)

    // showOperationId: true
    expect(wrapper.findComponent({ name: 'Content' }).text().includes('1234getUserById5678')).toBe(true)

    // documentDownloadType: json
    const downloadButtons = wrapper.findAll('.download-button')
    expect(downloadButtons).toHaveLength(1)
    expect(downloadButtons[0]?.find('.extension').text()).toBe('json')
  })

  it('all callbacks and complex configurations', async () => {
    const onLoaded = vi.fn()
    const onServerChange = vi.fn()
    const onSidebarClick = vi.fn()
    const onShowMore = vi.fn()
    const onDocumentSelect = vi.fn()
    vi.stubGlobal('location', { ...locationMock, hash: '#old' })
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    const authentication = {
      preferredSecurityScheme: 'apiKey',
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'x-api-key',
          value: 'test-token',
        },
      },
    }

    const servers = [
      { url: 'https://api.example.com', description: 'Production' },
      { url: 'https://api-staging.example.com', description: 'Staging' },
    ]

    const content = {
      ...createBasicDocument(),
      tags: [
        { name: 'Zebras', description: 'Zebra operations' },
        { name: 'Apples', description: 'Apple operations' },
        { name: 'Monkeys', description: 'Monkey operations' },
        { name: 'Bananas', description: 'Banana operations' },
      ],
      servers,
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            operationId: 'getUsers',
            tags: ['Zebras'],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SuperImportantUser',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        superSecretId: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            summary: 'Create user',
            operationId: 'createUser',
            tags: ['Zebras'],
          },
          delete: {
            summary: 'Delete users',
            operationId: 'deleteUsers',
            tags: ['Zebras'],
          },
        },
        '/posts': {
          get: {
            summary: 'Get posts',
            operationId: 'getPosts',
            tags: ['Apples'],
          },
        },
        '/monkeys': {
          get: {
            summary: 'Get monkeys',
            operationId: 'getMonkeys',
            tags: ['Monkeys'],
          },
        },
        '/bananas': {
          get: {
            summary: 'Get bananas',
            operationId: 'getBananas',
            tags: ['Bananas'],
          },
        },
      },
    }

    const wrapper = mountComponent({
      props: {
        configuration: {
          onLoaded,
          onServerChange,
          onSidebarClick,
          onShowMore,
          onDocumentSelect,
          generateHeadingSlug: (heading: { slug: string }) => `custom-test-slug-${heading.slug}`,
          generateOperationSlug: (operation: { method: string; path: string }) =>
            `custom-test-slug-${operation.method}-${operation.path}`,
          redirect: (hash: string) => hash.replace('#old', '#new'),
          servers,
          authentication,
          defaultHttpClient: {
            targetKey: 'node',
            clientKey: 'axios',
          },
          hiddenClients: ['unirest', 'node'],
          proxyUrl: 'https://proxy.example.com',
          tagsSorter: 'alpha',
          operationsSorter: 'method',
          expandAllResponses: true,
          searchHotKey: 'f',
          sources: [
            {
              slug: 'users-api',
              content,
            },
            {
              slug: 'posts-api',
              content: {
                openapi: '3.1.0',
                info: { title: 'Posts API', version: '1.0.0' },
                paths: {
                  '/posts': {
                    get: {
                      summary: 'Get posts',
                      operationId: 'getPosts',
                      tags: ['Posts'],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    })
    await flushPromises()

    // onLoaded: function
    expect(onLoaded).toHaveBeenCalled()

    // onServerChange: function
    const ServerSelector = wrapper.findComponent({ name: 'Selector' })
    await ServerSelector.vm.$emit('update:modelValue', 'https://api-staging.example.com')
    expect(onServerChange).toHaveBeenCalled()

    // generateHeadingSlug: function
    const infoDescription = wrapper.findComponent({ name: 'InfoDescription' })
    if (infoDescription.exists()) {
      const h1 = infoDescription.find('h1')
      if (h1.exists()) {
        expect(h1.html()).toContain('custom-test-slug-heading-1')
      }
    }

    // generateOperationSlug: function
    const operation = wrapper.findComponent({ name: 'Operation' })
    if (operation.exists()) {
      const section = operation.find('section')
      if (section.exists()) {
        expect(section.html()).toContain('custom-test-slug-GET-/posts')
      }
    }

    // redirect: function
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '#new')

    // servers: array
    const ServerSelectorComponent = wrapper.findComponent({ name: 'ServerSelector' })
    expect(ServerSelectorComponent.text().includes('api.example.com')).toBe(true)

    // authentication: object
    const Auth = wrapper.findComponent({ name: 'Auth' })
    const button = Auth.find('button[data-testid="data-table-password-toggle"]')
    await button.trigger('click')
    expect(Auth.text().includes('test-token')).toBe(true)

    // defaultHttpClient, hiddenClients, proxyUrl
    expect(wrapper.vm.workspaceStore.workspace['x-scalar-default-client']).toBe('node/axios')
    const clientOptions = wrapper.findComponent({ name: 'ClientSelector' }).props().clientOptions as ClientOptionGroup[]
    const clientKeysSet = new Set<string>(clientOptions.flatMap((group) => group.options.map((option) => option.id)))
    expect(clientKeysSet.has('node/axios')).toBe(false)
    expect(clientKeysSet.has('java/unirest')).toBe(false)
    expect(clientKeysSet.has('js/axios')).toBe(true)
    expect(wrapper.vm.workspaceStore.workspace['x-scalar-active-proxy']).toBe('https://proxy.example.com')

    // expandAllResponses: true
    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    if (modernLayout.exists()) {
      const operationResponses = modernLayout.findComponent({ name: 'OperationResponses' })
      if (operationResponses.exists()) {
        expect(operationResponses.props().collapsableItems).toBe(false)
      }
    }

    // onSidebarClick: function
    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    const operationItem = sidebarItems.find((item) => item.text().includes('Get posts'))
    await operationItem?.trigger('click')
    expect(onSidebarClick).toHaveBeenCalled()
    expect(onSidebarClick).toHaveBeenCalledWith(expect.stringContaining('/posts'))

    // tagsSorter: alpha
    const tagNames = wrapper.vm.sidebarItems
      .map((item) => item.title)
      .filter((text) => ['Apples', 'Bananas', 'Monkeys', 'Zebras'].includes(text))
    expect(tagNames).toEqual(['Apples', 'Bananas', 'Monkeys', 'Zebras'])

    // operationsSorter: method - operations within a tag are sorted by HTTP method
    const zebrasTag = wrapper.vm.sidebarItems.find((item) => item.title === 'Zebras')
    const operationMethods = (zebrasTag as TraversedTag)?.children
      ?.filter((child) => child.type === 'operation')
      .map((child) => child.method)
    expect(operationMethods).toEqual(['delete', 'get', 'post'])

    // onShowMore: function
    const showMoreButton = wrapper.findComponent({ name: 'ShowMoreButton' })
    if (showMoreButton.exists()) {
      await showMoreButton.trigger('click')
      expect(onShowMore).toHaveBeenCalled()
      expect(onShowMore).toHaveBeenCalledWith(expect.stringContaining('/bananas'))
    }

    // onDocumentSelect: function
    expect(onDocumentSelect).toHaveBeenCalledOnce()
    const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
    if (documentSelector.exists()) {
      await documentSelector.vm.$emit('update:modelValue', 'posts-api')
      await flushPromises()
      expect(onDocumentSelect).toHaveBeenCalledTimes(2)
    }

    // searchHotKey: f
    expect(wrapper.findComponent({ name: 'SearchModal' }).props().modalState.open).toBe(false)
    wrapper.trigger('keydown', { key: 'f', ctrlKey: true })
    expect(wrapper.findComponent({ name: 'SearchModal' }).props().modalState.open).toBe(true)
  })

  it('alternative values and edge cases', async () => {
    const content = {
      ...createBasicDocument(),
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
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        superSecretId: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
              },
              '404': {
                description: 'Not found',
              },
            },
          },
        },
        '/posts': {
          get: {
            summary: 'Get posts',
            operationId: 'getPosts',
            tags: ['Posts'],
          },
        },
      },
    }

    const wrapper = mountComponent({
      props: {
        configuration: {
          content,
          darkMode: false,
          forceDarkModeState: 'light',
          operationTitleSource: 'path',
          orderSchemaPropertiesBy: 'preserve',
          orderRequiredPropertiesFirst: false,
          expandAllModelSections: true,
        },
      },
    })
    await flushPromises()

    // darkMode: false
    expect(document.body.classList.contains('light-mode')).toBe(true)

    // forceDarkModeState: light
    expect(document.body.classList.contains('light-mode')).toBe(true)

    // operationTitleSource: path
    const items = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    const userPathItem = items.find((item) => item.text().includes('/users'))
    expect(userPathItem?.text().startsWith('/users')).toBe(true)

    // orderSchemaPropertiesBy: preserve, orderRequiredPropertiesFirst: false
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

    // expandAllModelSections: true
    const modelTag = wrapper.findComponent({ name: 'ModelTag' })
    expect(modelTag.text().includes('Show More')).toBe(false)
    expect(modelTag.text().includes('SuperImportantUser')).toBe(true)

    // expandAllResponses: false (default)
    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    if (modernLayout.exists()) {
      const operationResponses = modernLayout.findComponent({ name: 'OperationResponses' })
      if (operationResponses.exists()) {
        expect(operationResponses.props().collapsableItems).toBe(true)
        expect(operationResponses.text().includes('superSecretId')).toBe(false)
      }
    }

    // Test forceDarkModeState: dark separately by remounting
    wrapper.unmount()
    await flushPromises()

    const darkWrapper = mountComponent({
      props: {
        configuration: {
          content,
          forceDarkModeState: 'dark',
        },
      },
    })
    await flushPromises()
    expect(document.body.classList.contains('dark-mode')).toBe(true)
    darkWrapper.unmount()
  })
})
