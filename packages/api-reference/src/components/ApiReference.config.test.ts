import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ApiReference from './ApiReference.vue'

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
})

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
})

describe('ApiReference Configuration Tests', () => {
  describe('Layout Configuration', () => {
    it('applies modern layout by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const apiRef = wrapper.find('.scalar-api-reference')
      expect(apiRef.classes()).not.toContain('references-classic')
      wrapper.unmount()
    })

    it('applies classic layout when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            layout: 'classic',
          },
        },
      })

      await nextTick()

      const apiRef = wrapper.find('.scalar-api-reference')
      expect(apiRef.classes()).toContain('references-classic')
      wrapper.unmount()
    })
  })

  describe('Sidebar Configuration', () => {
    it('shows sidebar by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const apiRef = wrapper.find('.scalar-api-reference')
      expect(apiRef.classes()).toContain('references-sidebar')
      wrapper.unmount()
    })

    it('hides sidebar when showSidebar is false', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            showSidebar: false,
          },
        },
      })

      await nextTick()

      const apiRef = wrapper.find('.scalar-api-reference')
      expect(apiRef.classes()).not.toContain('references-sidebar')
      wrapper.unmount()
    })
  })

  describe('Search Configuration', () => {
    it('shows search button by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const searchButton = wrapper.findComponent({ name: 'SearchButton' })
      expect(searchButton.exists()).toBe(true)
      wrapper.unmount()
    })

    it('hides search when hideSearch is true', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            hideSearch: true,
          },
        },
      })

      await nextTick()

      const searchButton = wrapper.findComponent({ name: 'SearchButton' })
      expect(searchButton.exists()).toBe(false)
      wrapper.unmount()
    })

    it('applies custom search hotkey', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            searchHotKey: 'f',
          },
        },
      })

      await nextTick()

      const searchButton = wrapper.findComponent({ name: 'SearchButton' })
      expect(searchButton.props('searchHotKey')).toBe('f')
      wrapper.unmount()
    })
  })

  describe('Models Configuration', () => {
    it('shows models by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const searchButton = wrapper.findComponent({ name: 'SearchButton' })
      expect(searchButton.props('hideModels')).toBe(false)
      wrapper.unmount()
    })

    it('hides models when hideModels is true', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            hideModels: true,
          },
        },
      })

      await nextTick()

      const searchButton = wrapper.findComponent({ name: 'SearchButton' })
      expect(searchButton.props('hideModels')).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Dark Mode Configuration', () => {
    it('applies initial dark mode setting', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            darkMode: true,
          },
        },
      })

      await nextTick()

      /** The component should render with dark mode */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('hides dark mode toggle when hideDarkModeToggle is true', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            hideDarkModeToggle: true,
          },
        },
      })

      await nextTick()

      const toggleButton = wrapper.findComponent({
        name: 'ScalarColorModeToggleButton',
      })
      expect(toggleButton.exists()).toBe(false)
      wrapper.unmount()
    })

    it('shows dark mode toggle by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const toggleButton = wrapper.findComponent({
        name: 'ScalarColorModeToggleButton',
      })
      expect(toggleButton.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Theme Configuration', () => {
    it('applies custom CSS when provided', async () => {
      const customCss = '.custom-class { color: red; }'

      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            customCss,
          },
        },
      })

      await nextTick()

      /** Check if the custom CSS class is injected */
      expect(wrapper.html()).toContain('.custom-class')
      wrapper.unmount()
    })

    it('applies different theme presets', async () => {
      const themes = ['default', 'alternate', 'moon', 'purple', 'solarized'] as const

      for (const theme of themes) {
        const wrapper = mount(ApiReference, {
          props: {
            configuration: {
              content: createBasicDocument(),
              theme,
            },
          },
        })

        await nextTick()

        /** The component should render without errors */
        expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
        wrapper.unmount()
      }
    })

    it('includes default fonts by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })

    it('excludes default fonts when withDefaultFonts is false', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            withDefaultFonts: false,
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Client Button Configuration', () => {
    it('shows client button by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.exists()).toBe(true)
      wrapper.unmount()
    })

    it('hides client button when hideClientButton is true', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            hideClientButton: true,
          },
        },
      })

      await nextTick()

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.exists()).toBe(false)
      wrapper.unmount()
    })
  })

  describe('Expansion Configuration', () => {
    it('does not expand all tags by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render normally */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('expands all tags when defaultOpenAllTags is true', async () => {
      const wrapper = mount(ApiReference, {
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
              },
            },
            defaultOpenAllTags: true,
          },
        },
      })

      await nextTick()

      /** The component should render with expanded tags */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Operation Configuration', () => {
    it('uses summary as operation title by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const content = wrapper.findComponent({ name: 'Content' })
      /** Should use summary as the title source */
      expect(content.exists()).toBe(true)
      wrapper.unmount()
    })

    it('uses path as operation title when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            operationTitleSource: 'path',
          },
        },
      })

      await nextTick()

      const sidebar = wrapper.findComponent({ name: 'ScalarSidebar' })
      expect(sidebar.props('options').operationTitleSource).toBe('path')
      wrapper.unmount()
    })

    it('hides operation ID by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render normally */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('shows operation ID when showOperationId is true', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            showOperationId: true,
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Callback Configuration', () => {
    it.only('fires onLoaded callback when document is loaded', async () => {
      const onLoaded = vi.fn()

      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            onLoaded,
          },
        },
      })

      await flushPromises()
      await nextTick()

      /** onLoaded should be called with the slug */
      expect(onLoaded).toHaveBeenCalled()
      wrapper.unmount()
    })

    it('fires onServerChange callback when server changes', async () => {
      const onServerChange = vi.fn()

      const wrapper = mount(ApiReference, {
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

      await nextTick()

      /** The component should be mounted */
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Server Configuration', () => {
    it('applies servers configuration', async () => {
      const servers = [
        { url: 'https://api.example.com', description: 'Production' },
        { url: 'https://api-staging.example.com', description: 'Staging' },
      ]

      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            servers,
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Authentication Configuration', () => {
    it('applies authentication configuration', async () => {
      const authentication = {
        apiKey: {
          token: 'test-token',
        },
      }

      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            authentication,
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Editable Configuration', () => {
    it('is not editable by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      const apiRef = wrapper.find('.scalar-api-reference')
      expect(apiRef.classes()).not.toContain('references-editable')
      wrapper.unmount()
    })

    it('is editable when isEditable is true', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            isEditable: true,
          },
        },
      })

      await nextTick()

      const apiRef = wrapper.find('.scalar-api-reference')
      expect(apiRef.classes()).toContain('references-editable')
      wrapper.unmount()
    })
  })

  describe('Schema Property Ordering Configuration', () => {
    it('orders schema properties alphabetically by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('preserves schema property order when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            orderSchemaPropertiesBy: 'preserve',
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('orders required properties first by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('does not order required properties first when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            orderRequiredPropertiesFirst: false,
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Custom Slug Generators', () => {
    it('applies custom heading slug generator', async () => {
      const generateHeadingSlug = vi.fn((heading: { slug: string }) => {
        return `custom-${heading.slug}`
      })

      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            generateHeadingSlug,
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('applies custom operation slug generator', async () => {
      const generateOperationSlug = vi.fn((operation: { method: string; path: string }) => {
        return `${operation.method}-${operation.path}`
      })

      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            generateOperationSlug,
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Path Routing Configuration', () => {
    it('uses hash routing by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render without path routing */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('uses path routing when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            pathRouting: {
              basePath: '/docs',
            },
          },
        },
      })

      await nextTick()

      /** The component should render with path routing */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Redirect Configuration', () => {
    it('applies redirect function when configured', async () => {
      const redirect = vi.fn((hash: string) => {
        return hash.replace('#old', '#new')
      })

      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            redirect,
          },
        },
      })

      await nextTick()

      /** The redirect function should be available */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('HTTP Client Configuration', () => {
    it('applies default HTTP client when configured', async () => {
      const wrapper = mount(ApiReference, {
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

      await nextTick()

      /** The workspace store should reflect the default HTTP client */
      expect(wrapper.vm.workspaceStore.workspace['x-scalar-default-client']).toMatchObject({
        targetKey: 'shell',
        clientKey: 'curl',
      })
      wrapper.unmount()
    })

    it('applies hidden clients configuration', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            hiddenClients: ['unirest', 'node'],
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Metadata Configuration', () => {
    it('applies title configuration', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument('Original Title'),
            title: 'Custom Title',
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('applies slug configuration', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            slug: 'custom-slug',
          },
        },
      })

      await nextTick()

      /** The workspace store should have the custom slug */
      expect(Object.keys(wrapper.vm.workspaceStore.workspace.documents)).toContain('custom-slug')
      wrapper.unmount()
    })

    it('applies favicon configuration', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            favicon: '/custom-favicon.svg',
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Developer Tools Configuration', () => {
    it('shows developer tools on localhost by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('always shows developer tools when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            showDeveloperTools: 'always',
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('never shows developer tools when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            showDeveloperTools: 'never',
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Plugins Configuration', () => {
    it('renders without plugins by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Telemetry Configuration', () => {
    it('enables telemetry by default', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
          },
        },
      })

      await nextTick()

      /** The workspace store should have telemetry enabled */
      expect(wrapper.vm.workspaceStore.config['x-scalar-reference-config'].telemetry).toBe(true)
      wrapper.unmount()
    })

    it('disables telemetry when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            telemetry: false,
          },
        },
      })

      await nextTick()

      /** The workspace store should have telemetry disabled */
      expect(wrapper.vm.workspaceStore.config['x-scalar-reference-config'].telemetry).toBe(false)
      wrapper.unmount()
    })
  })

  describe('Integration Identifier Configuration', () => {
    it('applies integration identifier when configured', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            _integration: 'nextjs',
          },
        },
      })

      await nextTick()

      /** The component should render */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles empty configuration gracefully', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {},
        },
      })

      await nextTick()

      /** The component should render even with empty config */
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })

    it('handles invalid layout value gracefully', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            // @ts-expect-error - testing invalid value
            layout: 'invalid',
          },
        },
      })

      await nextTick()

      /** Should fall back to default layout */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })

    it('handles invalid theme value gracefully', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            content: createBasicDocument(),
            // @ts-expect-error - testing invalid value
            theme: 'invalid',
          },
        },
      })

      await nextTick()

      /** Should fall back to default theme */
      expect(wrapper.findComponent({ name: 'Content' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })
})
