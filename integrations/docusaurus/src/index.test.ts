import { describe, expect, it, vi } from 'vitest'

import ScalarDocusaurus from './index'

describe('ScalarDocusaurus', () => {
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

    // Simulate contentLoaded
    plugin.contentLoaded?.({
      content: {},
      actions: mockActions,
    })

    // Check navbar item was added with correct path
    expect(mockContext.siteConfig.themeConfig.navbar.items).toHaveLength(1)
    expect(mockContext.siteConfig.themeConfig.navbar.items[0]).toEqual({
      to: '/my-site/api',
      label: 'API Docs',
      position: 'left',
    })

    // Check route was added with correct path
    expect(mockActions.addRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/my-site/api',
      }),
    )
  })

  it('adds navbar link with default route when no route specified', () => {
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

    expect(mockContext.siteConfig.themeConfig.navbar.items[0].to).toBe('/docs/scalar')
    expect(mockActions.addRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/docs/scalar',
      }),
    )
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
})
