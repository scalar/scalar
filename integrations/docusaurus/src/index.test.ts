import { describe, expect, it, vi } from 'vitest'

import ScalarDocusaurus from './index'

describe('ScalarDocusaurus', () => {
  describe('plugin creation', () => {
    it('returns a plugin object with required methods', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/scalar',
      })

      expect(plugin).toHaveProperty('name', '@scalar/docusaurus')
      expect(plugin).toHaveProperty('injectHtmlTags')
      expect(plugin).toHaveProperty('loadContent')
      expect(plugin).toHaveProperty('contentLoaded')
    })
  })

  describe('injectHtmlTags', () => {
    it('injects default CDN script when no CDN specified', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/scalar',
      })

      const result = (plugin as any).injectHtmlTags()

      expect(result).toEqual({
        preBodyTags: [
          {
            tagName: 'script',
            attributes: {
              src: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
            },
          },
        ],
      })
    })

    it('injects custom CDN script when specified', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/scalar',
        cdn: 'https://cdn.example.com/custom-scalar.js',
      })

      const result = (plugin as any).injectHtmlTags()

      expect(result).toEqual({
        preBodyTags: [
          {
            tagName: 'script',
            attributes: {
              src: 'https://cdn.example.com/custom-scalar.js',
            },
          },
        ],
      })
    })
  })

  describe('loadContent', () => {
    it('returns default options with merged configuration', async () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Custom Label',
        route: '/custom-route',
        configuration: {
          theme: 'purple',
        },
      })

      const content = await (plugin as any).loadContent()

      expect(content).toEqual({
        label: 'Custom Label',
        route: '/custom-route',
        showNavLink: true,
        configuration: {
          _integration: 'docusaurus',
          theme: 'purple',
        },
      })
    })

    it('applies default values for missing options', async () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Test Label',
        route: '/test-route',
      })

      const content = await (plugin as any).loadContent()

      expect(content).toEqual({
        label: 'Test Label',
        route: '/test-route',
        showNavLink: true,
        configuration: {
          _integration: 'docusaurus',
        },
      })
    })

    it('merges configuration objects correctly', async () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Test',
        route: '/test',
        configuration: {
          theme: 'kepler',
          layout: 'modern',
        },
      })

      const content = await (plugin as any).loadContent()

      expect(content?.configuration).toEqual({
        _integration: 'docusaurus',
        theme: 'kepler',
        layout: 'modern',
      })
    })
  })

  describe('contentLoaded', () => {
    it('adds navbar link with baseUrl when showNavLink is true', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/my-site/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'API Docs',
        route: '/api',
        showNavLink: true,
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items).toHaveLength(1)
      expect(mockContext.siteConfig.themeConfig.navbar.items[0]).toEqual({
        to: '/my-site/api',
        label: 'API Docs',
        position: 'left',
      })

      expect(mockActions.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/my-site/api',
        }),
      )
    })

    it('adds navbar link with default values', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/docs/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/scalar',
        showNavLink: true,
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items[0]).toEqual({
        to: '/docs/scalar',
        label: 'Scalar',
        position: 'left',
      })
    })

    it('does not add navbar link when showNavLink is false', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/scalar',
        showNavLink: false,
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items).toHaveLength(0)
      expect(mockActions.addRoute).toHaveBeenCalled()
    })

    it('handles root baseUrl correctly', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        showNavLink: true,
        route: '/scalar',
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items[0].to).toBe('/scalar')
      expect(mockActions.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/scalar',
        }),
      )
    })

    it('always adds route regardless of showNavLink setting', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/base/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/api',
        showNavLink: false, // navbar disabled
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      // Route should still be added
      expect(mockActions.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/base/api',
          exact: true,
        }),
      )

      // But navbar should not have items
      expect(mockContext.siteConfig.themeConfig.navbar.items).toHaveLength(0)
    })

    it('passes content to route configuration', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/scalar',
      })

      const testContent = {
        configuration: {
          theme: 'purple',
        },
      }

      plugin.contentLoaded?.({
        content: testContent,
        actions: mockActions,
      })

      expect(mockActions.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/scalar',
          exact: true,
          configuration: {
            theme: 'purple',
          },
        }),
      )
    })

    it('uses default route when none specified', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/site/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'Scalar',
        route: '/scalar',
        showNavLink: true,
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items[0].to).toBe('/site/scalar')
      expect(mockActions.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/site/scalar',
        }),
      )
    })

    it('uses default label when none specified', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        route: '/api',
        showNavLink: true,
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items[0].label).toBe('Scalar')
    })
  })

  describe('edge cases', () => {
    it('handles complex baseUrl paths', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/very/deep/nested/path/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'API',
        route: '/docs',
        showNavLink: true,
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items[0].to).toBe('/very/deep/nested/path/docs')
      expect(mockActions.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/very/deep/nested/path/docs',
        }),
      )
    })

    it('handles empty route string', () => {
      const mockContext = {
        siteConfig: {
          baseUrl: '/base/',
          themeConfig: {
            navbar: {
              items: [],
            },
          },
        },
      } as any

      const mockActions = {
        addRoute: vi.fn(),
      } as any

      const plugin = ScalarDocusaurus(mockContext, {
        label: 'API',
        route: '',
        showNavLink: true,
      })

      plugin.contentLoaded?.({
        content: {},
        actions: mockActions,
      })

      expect(mockContext.siteConfig.themeConfig.navbar.items[0].to).toBe('/base/')
      expect(mockActions.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/base/',
        }),
      )
    })
  })
})
